# Downloads API Documentation

Base URL (dev):

```
http://127.0.0.1:8000/api/downloads/
```

This document describes the Downloads API implemented in the `downloads` Django app. It covers endpoints, request/response bodies, authentication, permissions, example curl calls, and common errors.

---

## Overview

The Downloads API provides two related capabilities:

- Recording download events (DownloadHistory) via a DRF ViewSet registered on the router.
- A protected file download endpoint which streams game files to authorized users and logs the download.

Router registrations exposed by the app:
- `downloads` — full list/create/retrieve/delete for `DownloadHistory` (registered with DefaultRouter at `/api/downloads/downloads/`).
- `popular-games` — read-only list for popular games (registered with DefaultRouter at `/api/downloads/popular-games/`).

Protected file download endpoint (manual route):
- `GET /api/downloads/games/<int:game_id>/download/` — streams the game's file if the requester is authorized and the file exists.

DownloadHistory fields (exposed by `DownloadHistorySerializer`):
- `id` (integer) — read-only
- `game` (integer) — FK to `games.Game` (write), nested or id in responses depending on serializer
- `user` (integer or null) — read-only; set from authenticated token if present
- `timestamp` (datetime) — read-only
- `ip_address` (string) — read-only; set server-side
- `device_info` (string) — optional client-supplied device info

---

## Authentication & Permissions

- Authentication: token-based (DRF TokenAuth) used by the examples below.
- Header format:

```
Authorization: Token <TOKEN>
```

Permission semantics:
- Creating a `DownloadHistory` record (POST `/api/downloads/downloads/`) is allowed for anonymous and authenticated clients. When a valid token is supplied the server sets the `user` field from the token.
- Listing, retrieving or deleting `DownloadHistory` objects (`GET /api/downloads/downloads/`, `GET /api/downloads/downloads/<id>/`, `DELETE ...`) is restricted to admins (custom `IsAdminUser` checks `user.role == 'admin'`).
- The protected file download endpoint (`GET /api/downloads/games/<id>/download/`) requires authentication. Download allowed when any of:
  - the game's `status` == `approved`;
  - the requester is the game's developer (owner);
  - the requester has the `admin` role.

Implementation notes:
- The `DownloadHistorySerializer` marks `user`, `timestamp`, and `ip_address` as read-only and sets `user` automatically from the request if authenticated.
- The download view logs a `DownloadHistory` row for successful downloads and streams the file via `FileResponse` in development. For production-grade delivery use X-Accel-Redirect or presigned object-store URLs.

---

## Endpoints

1) List DownloadHistory records

- URL: `GET /api/downloads/downloads/`
- Permission: admin only
- Response (200 OK): array of download history objects

2) Create a DownloadHistory record

- URL: `POST /api/downloads/downloads/`
- Permission: AllowAny (anonymous OK)
- Content-type: application/json
- Request body example:

```json
{ "game": 1, "device_info": "curl test" }
```

- Behavior: if a valid token is provided, `user` is set from the token; otherwise `user` remains null.
- Response (201 Created): created DownloadHistory JSON with server-populated fields.

3) Retrieve a single DownloadHistory record

- URL: `GET /api/downloads/downloads/<int:pk>/`
- Permission: admin only
- Response (200 OK): download history object

4) Delete a DownloadHistory record

- URL: `DELETE /api/downloads/downloads/<int:pk>/`
- Permission: admin only
- Response: 204 No Content

5) Protected file download (stream)

- URL: `GET /api/downloads/games/<int:game_id>/download/`
- Permission: authenticated; additional checks (approved/owner/admin) apply
- Behavior: streams the game's file as an attachment when allowed and logs the download in `DownloadHistory`.
- Response: 200 with file stream, or 403/404 as appropriate.

6) List Popular Games

- URL: `GET /api/downloads/popular-games/`
- Permission: AllowAny (public)
- Response (200 OK): array of game objects sorted by download count (descending). Use `download_count` field in standard Game object serialization.

---

## curl Examples

Replace placeholders before running: `<USER_TOKEN>`, `<ADMIN_TOKEN>`, `<GAME_ID>`, `<DOWNLOAD_ID>`.

### 1) Create a DownloadHistory record (anonymous)

```bash
curl -i -X POST http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Content-Type: application/json" \
  -d '{"game": 1, "device_info":"curl test"}'
```

Expected: HTTP 201 with created DownloadHistory JSON (ip and device_info populated server-side).

### 2) Create a DownloadHistory record (authenticated — user set from token)

```bash
curl -i -X POST http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <USER_TOKEN>" \
  -d '{"game": 1, "device_info":"curl test (auth)"}'
```

Expected: HTTP 201 and the response's `user` will be the authenticated user's id.

### 3) List download records (admin only)

```bash
curl -i -X GET http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 200 with array of records; non-admin gets 403.

### 4) Retrieve a single record (admin only)

```bash
curl -i -X GET http://127.0.0.1:8000/api/downloads/downloads/<DOWNLOAD_ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

### 5) Protected game download (authenticated)

```bash
curl -i -L -X GET http://127.0.0.1:8000/api/downloads/games/<GAME_ID>/download/ \
  -H "Authorization: Token <USER_TOKEN>"
```

Expected: HTTP 200 with file stream (or 302/X-Accel redirect in some deployment setups). A `DownloadHistory` row should be created for this download recording `user`, `ip_address` and `device_info`.

### 6) Unauthenticated download attempt (should be denied)

```bash
curl -i -L -X GET http://127.0.0.1:8000/api/downloads/games/<GAME_ID>/download/
```

Expected: HTTP 401 or 403 and no `user` set on any created DownloadHistory row.

### 7) List popular games (public)

```bash
curl -i -X GET http://127.0.0.1:8000/api/downloads/popular-games/
```

Expected: HTTP 200 with array of games sorted by popularity.

### 8) Verify logging via admin

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | jq -r '.token')

curl -i -X GET http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Authorization: Token $ADMIN_TOKEN"
```

Look for a record with the `game` id you downloaded and the `user` id if you used a token.

---

## Responses & error codes

- 200 OK — successful file stream or GET
- 201 Created — successful create of DownloadHistory
- 204 No Content — successful delete
- 400 Bad Request — validation errors
- 401 Unauthorized — missing or invalid token
- 403 Forbidden — authenticated but not allowed (e.g., download of non-approved game by non-owner)
- 404 Not Found — resource or file doesn't exist

---

## Notes & production considerations

- Development vs production file delivery:
  - The app currently streams files with Django's `FileResponse` for simplicity in development. This is not efficient or secure for large files in production.
  - Recommended production approaches:
    - X-Accel-Redirect (nginx) / X-Sendfile (Apache): keep media files outside the public webroot and return an internal redirect header from Django so the webserver serves the file securely.
    - Store files in an object store (S3/MinIO) and return presigned URLs for authenticated downloads.
    - If you must stream through Django, ensure the webserver does NOT expose MEDIA_URL directly and be mindful of memory and bandwidth.

- Make sure your deployment/webserver does not serve MEDIA files publicly if you rely on the protected endpoint for access control.

---

## How to test locally

1. From the `backend/` folder run migrations and start the server:

```bash
python3 manage.py migrate
python3 manage.py runserver
```

2. Use the curl examples above. Remember to replace tokens and IDs.

3. If a protected download returns 404, verify in the Django shell that the `Game` exists, its `status` allows the requester, and that `file_path` points to a real file on disk:

```bash
python3 manage.py shell
>>> from games.models import Game
>>> g = Game.objects.get(pk=<GAME_ID>)
>>> g.status, g.developer_id, g.file_path, import os; os.path.exists(g.file_path.path)
```

---

Document created at `api_docs/download_api.md`.
