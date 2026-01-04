````markdown
# Games API Documentation

Base URL (dev):

```
http://127.0.0.1:8000/api/games/
```

This document describes the Games API implemented in the `games` Django app. It covers endpoints, request/response bodies, authentication, permissions, example curl calls, and common errors.

---

## Overview

The Games API exposes game submission and management functionality. There are two router registrations:
- `games` — full CRUD, backed by `GameViewSet` (create/update/delete/list/detail). Access is controlled by role-based permissions.
- `games-list` — read-only list/retrieve for public consumption, backed by `GameListView`/`ReadOnlyModelViewSet`.

Game fields (exposed by `GameSerializer`):
- `id` (integer) — read-only
- `title` (string)
- `title_ar` (string) — Arabic title
- `description` (string)
- `description_ar` (string) — Arabic description
- `file_path` (file) — uploaded game file (zip/rar/7z/exe)
- `status` (string) — one of `pending`, `approved`, `rejected`; default `pending`
- `developer` (integer) — user id (FK to `users.User`)
- `categories` (array) — list of category objects (read-only)
  Use `category_ids` (array of integers or repeated form fields) in write requests to assign one or more categories.
- `rejection_reason` (string) — optional
- `created_at` / `updated_at` (timestamps)
- `download_count` (integer) — read-only

---

## Authentication & Permissions

- Authentication: token-based (DRF TokenAuth) used by the examples below.
- Header format:

```
Authorization: Token <TOKEN>
```

- Role semantics and permissions:
  - Anonymous users (not authenticated): may view games via `games-list` — only games with `status == 'approved'` are visible.
  - Developers (user.role == 'developer'):
    - May create games. When a developer creates a game and does not set `developer`, the API will assign the requesting user as the developer.
    - May update and delete their own games (object-level). Developers are NOT allowed to set or change `status` — attempts to set `status` are rejected with 403.
  - Admins (user.role == 'admin'):
    - May create, update, delete any game.
    - May set and change `status` (approve/reject).

Implementation notes: the code uses custom permissions (e.g. `IsAdminUser`, `IsAdminOrDeveloper`, `IsOwnerOrAdmin`) and serializer validation that prevents non-admins from setting `status` on create/update.

---

## Endpoints

1) Public list games

- URL: `GET /api/games/games-list/`
- Permission: AllowAny (public)
- Response (200 OK): array of game objects (only `approved` for public users)

Example response (partial):

```json
[
  {
    "id": 12,
    "title": "Space Runner",
    "title_ar": "عداء الفضاء",
    "description": "An endless runner in space",
    "status": "approved",
    "developer": 5,
    "categories": [
      { "id": 2, "name": "Action" }
    ],
    "created_at": "2025-12-18T19:00:00Z"
  }
]
```

2) Retrieve a single game (public)

- URL: `GET /api/games/games-list/<int:pk>/`
- Permission: AllowAny (but non-approved returns 404/403 to public)

3) Create a game (developer or admin)

- URL: `POST /api/games/games/`
- Permission: authenticated developers or admins (`IsAdminOrDeveloper`)
- Content-type: multipart/form-data (use `-F` with curl to upload `file_path`)

Request body (multipart example):

```
title (string, required)
title_ar (string, required)
description (string, required)
description_ar (string, required)
category_ids (int or repeated form fields, optional) — one or more category ids to assign to the game
file_path (file upload, required if model requires)
status (string, optional — only honored if admin)
developer (int, optional — admin only)
```

Response: 201 Created with created game JSON. Developers who don't pass `developer` get assigned automatically.

Errors: 400 validation, 401 unauthorized, 403 forbidden (e.g. developer trying to set status).

4) Update a game (PATCH)

- URL: `PATCH /api/games/games/<int:pk>/`
- Permission: admin or owner (developer) via `IsOwnerOrAdmin`.
- Partial updates allowed. For file updates use multipart PATCH.

5) Delete a game

- URL: `DELETE /api/games/games/<int:pk>/`
- Permission: admin or owner

---

## curl Examples

Note: most create/update operations upload files and use multipart (`-F`). Replace placeholders before running.

### 1) Public list

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/games-list/
```

### 2) Retrieve single game

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/games-list/12/
```

### 3) Developer create (multipart)

```bash
# create dummy file for testing
touch /tmp/dummy_game.zip && echo "test" > /tmp/dummy_game.zip

curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -H "Authorization: Token <DEV_TOKEN>" \
  -F "title=My Dev Game" \
  -F "title_ar=لعبتي" \
  -F "description=A cool game by dev" \
  -F "description_ar=لعبة رائعة" \
  -F "category_ids=<CATEGORY_ID>" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

Expected: 201 Created. Developer will be assigned automatically.

### 4) Admin create (set developer + status)

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -F "title=Admin Game" \
  -F "title_ar=لعبة المدير" \
  -F "description=Added by admin" \
  -F "description_ar=أضيفت من قبل المسؤول" \
  -F "category_ids=<CATEGORY_ID>" \
  -F "developer=<DEVELOPER_ID>" \
  -F "status=approved" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

### 5) Update (JSON) — change description (owner or admin)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>" \
  -d '{"description":"Updated description"}'
```

### 6) Update (multipart) — replace uploaded file

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>" \
  -F "file_path=@/tmp/new_game.zip;type=application/zip"
```

### 7) Admin change status

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"status":"approved"}'
```

### 8) Delete a game

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>"
```

### 9) Unauthorized attempts

Anonymous or non-developer authenticated users attempting to `POST /api/games/games/` should receive 401/403.

---

## Responses & error codes

- 200 OK — successful GET/PATCH
- 201 Created — successful create
- 204 No Content — successful delete
- 400 Bad Request — validation errors (response contains field-level messages)
- 401 Unauthorized — missing/invalid token
- 403 Forbidden — authenticated but not allowed (e.g. developer changing status)
- 404 Not Found — resource doesn't exist

---

## Notes & suggestions

- Always include `title_ar` and `description_ar` where required by your serializer. If you get 400 errors complaining these are required, include them in the request.
- Use multipart (`-F`) when uploading files; do not send `file_path` as a JSON string when the serializer expects a FileField.
- We added a data migration that assigns an `Uncategorized` category and a developer (if available) for existing games that had nulls. If you prefer a different default, change the migration or populate manually via the Django shell.
- Consider adding pagination to the public list if the dataset grows.

---

## How to test locally

1. From the `backend/` folder run migrations and start the server:

```bash
python3 manage.py migrate
python3 manage.py runserver
```

2. Use the curl examples above. If you need session/CSRF examples (cookie-jar), I can add them.
If you'd like, I can also produce an OpenAPI snippet or a Postman collection for these endpoints.
Document created at `api_docs/game_api.md`.

````
