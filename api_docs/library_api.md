# Library API Documentation

Base URL (dev):

```
http://127.0.0.1:8000/api/library/
```

This document describes the Library API implemented in the `library` Django app. It covers endpoints, request/response bodies, authentication, permissions, example curl calls, and common errors.

---

## Overview

The Library API lets authenticated users keep a personal list of games they own or want to track. The app exposes a single router registration:
- `entries` — full list/create/retrieve/delete for library entries (backed by `LibraryEntryViewSet`).

LibraryEntry fields (exposed by `LibraryEntrySerializer`):
- `id` (integer) — read-only
- `user` (integer) — read-only on responses; set automatically from the authenticated token when creating
- `game` (object) — nested game representation on read; accepts game PK on write
- `added_at` (timestamp) — read-only

---

## Authentication & Permissions

- Authentication: token-based (DRF TokenAuth) used by the examples below.
- Header format:

```
Authorization: Token <TOKEN>
```

- Permission semantics:
  - Create (POST) and List (GET /entries/) require authentication. The `user` is taken from the token — clients MUST NOT send a `user` field in the POST body.
  - Retrieve (GET /entries/<id>/) and Delete (DELETE /entries/<id>/) are allowed for the entry owner or any admin (`IsOwnerOrAdmin`).
  - Admins (user.role == 'admin') see all entries when listing; normal users only see their own entries.

Implementation notes: the serializer sets `user = HiddenField(CurrentUserDefault())`, and `game` is limited to games with `status='approved'` by default (server-side enforcement).

---

## Endpoints

1) List library entries (user's entries)

- URL: `GET /api/library/entries/`
- Permission: authenticated users (admin sees all)
- Response (200 OK): array of library entry objects (nested game data)

Example response (partial):

```json
[
  {
    "id": 42,
    "user": 4,
    "game": {
      "id": 12,
      "title": "Space Runner",
      "status": "approved"
    },
    "added_at": "2025-12-28T15:22:00Z"
  }
]
```

2) Create a library entry (add a game)

- URL: `POST /api/library/entries/`
- Permission: authenticated
- Content-type: application/json
- Request body (JSON):

```json
{ "game": <GAME_ID> }
```

- Behavior: the server sets `user` from the auth token; `game` must be an approved game's id unless server rules are relaxed. Creating a duplicate entry (same user + game) returns 400.
- Response (201 Created): created entry JSON with nested `game`.

Errors: 400 validation, 401 unauthorized, 403 if attempting an action not allowed.

3) Retrieve a single library entry

- URL: `GET /api/library/entries/<int:pk>/`
- Permission: owner or admin
- Response (200 OK): library entry object

4) Delete a library entry

- URL: `DELETE /api/library/entries/<int:pk>/`
- Permission: owner or admin
- Response: 204 No Content

---

## curl Examples

Replace placeholders before running: `<USER_TOKEN>`, `<ADMIN_TOKEN>`, `<GAME_ID>`, `<ENTRY_ID>`.

### 1) List your library (authenticated)

```bash
curl -i -X GET http://127.0.0.1:8000/api/library/entries/ \
  -H "Authorization: Token <USER_TOKEN>"
```

### 2) Add a game to your library

```bash
curl -i -X POST http://127.0.0.1:8000/api/library/entries/ \
  -H "Authorization: Token <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"game": <GAME_ID>}'
```

Expected: HTTP 201 with created entry (nested `game`).

### 3) Attempt to add while anonymous (unauthenticated)

```bash
curl -i -X POST http://127.0.0.1:8000/api/library/entries/ \
  -H "Content-Type: application/json" \
  -d '{"game": <GAME_ID>}'
```

Expected: HTTP 401 Unauthorized.

### 4) Duplicate add (second attempt fails)

```bash
# first add (expected 201)
curl -i -X POST http://127.0.0.1:8000/api/library/entries/ \
  -H "Authorization: Token <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"game": <GAME_ID>}'

# second add (expected 400)
curl -i -X POST http://127.0.0.1:8000/api/library/entries/ \
  -H "Authorization: Token <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"game": <GAME_ID>}'
```

API will return:

```json
{"detail":"This game is already in your library."}
```

### 5) Retrieve an entry (owner or admin)

```bash
curl -i -X GET http://127.0.0.1:8000/api/library/entries/<ENTRY_ID>/ \
  -H "Authorization: Token <USER_TOKEN>"
```

### 6) Delete an entry (owner or admin)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/library/entries/<ENTRY_ID>/ \
  -H "Authorization: Token <USER_TOKEN>"
```

---

## Responses & error codes

- 200 OK — successful GET/PATCH
- 201 Created — successful create
- 204 No Content — successful delete
- 400 Bad Request — validation errors (e.g., missing/invalid `game`, duplicate)
- 401 Unauthorized — missing or invalid token
- 403 Forbidden — authenticated but not owner/admin
- 404 Not Found — resource doesn't exist

---

## Notes & troubleshooting

- The `user` is taken from the authenticated token; do not include it in request bodies.
- By default only `approved` games may be added; if you need different rules (developers adding pending games, etc.) I can change the serializer queryset or add conditional logic.
- If you get a 400 about `game`, verify the game id exists and is `status: "approved"` unless server rules were changed.
- Use the `users` login endpoint to obtain tokens (see `api_docs/user_api.md`).

---

## How to test locally

1. From the `backend/` folder run migrations and start the server:

```bash
python3 manage.py migrate
python3 manage.py runserver
```

2. Use the curl examples above.

If you want, I can also produce an OpenAPI snippet or Postman collection for these endpoints.

Document created at `api_docs/library_api.md`.
