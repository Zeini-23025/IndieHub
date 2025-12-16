# Users API Documentation

Base URL (dev):

```
http://127.0.0.1:8000/api/users/
```

This document describes the Users API implemented in the `users` Django app. It covers endpoints, request/response bodies, authentication, permissions, example curl calls, and common errors.

---

## Overview

The Users API provides:

- Public registration (create a user account)
- Token-based login (DRF Token) that returns an auth token
- Admin-only user listing and creation
- Owner-or-admin access for retrieving/updating/deleting a specific user

The project uses a custom `User` model (subclass of `AbstractUser`) with an additional `role` field. Role choices: `admin`, `developer`, `user`.

User fields (exposed by serializer):
- `id` (integer) - read-only
- `username` (string)
- `email` (string)
- `password` (string) - write-only
- `role` (string) - one of `admin`, `developer`, `user` (defaults to `user`)
- `first_name` (string)
- `last_name` (string)
- `date_joined` (datetime) - read-only

Passwords are hashed via Django's `create_user()` when creating accounts.

---

## Authentication

Login endpoint returns a DRF Token. Include that token on subsequent requests with the header:

```
Authorization: Token <TOKEN>
```

Notes:
- Token-based auth is stateless and recommended for API clients (SPAs, mobile).
- If you prefer session-based login (cookies + CSRF), the endpoints can be adapted; current examples use tokens.

---

## Endpoints

1) Register (public)

- URL: `POST /api/users/register/`
- Permission: AllowAny
- Purpose: Create a new user account (self-register)
- Request body (JSON):

```json
{
  "username": "zeiny",
  "password": "zeiny123",
  "email": "zeiny@example.com",
  "role": "user",        // optional; default is "user"
  "first_name": "Zein", // optional
  "last_name": "Y"      // optional
}
```

- Response (201 Created):

```json
{
  "id": 5,
  "username": "zeiny",
  "email": "zeiny@example.com",
  "role": "user",
  "first_name": "Zein",
  "last_name": "Y",
  "date_joined": "2025-12-16T21:17:53Z"
}
```

- Errors:
  - 400 Bad Request for validation errors (e.g., missing username or weak password)
  - 409 Conflict is not used by default; unique username returns 400 with message


2) Login (token)

- URL: `POST /api/users/login/`
- Permission: AllowAny
- Purpose: Authenticate and return a token
- Request body (JSON):

```json
{
  "username": "zeiny",
  "password": "zeiny123"
}
```

- Response (200 OK):

```json
{
  "token": "0123456789abcdef...",
  "user": {
    "id": 5,
    "username": "zeiny",
    "email": "zeiny@example.com",
    "role": "user",
    "first_name": "Zein",
    "last_name": "Y",
    "date_joined": "2025-12-16T21:17:53Z"
  }
}
```

- Errors:
  - 401 Unauthorized: invalid credentials


3) List & Create users (management)

- URL: `GET /api/users/users/`  — list users (Admin only)
- URL: `POST /api/users/users/` — create a user via admin (Admin only)
- Permission: `IsAdminUser` (custom permission in this project) + `IsAuthenticated`

- Create request body example (admin creating developer):

```json
{
  "username": "dev1",
  "password": "devpass",
  "email": "dev1@example.com",
  "role": "developer"
}
```

- Response (201 Created for POST, 200 OK for GET list)

- Errors:
  - 401 Unauthorized if no token or invalid token
  - 403 Forbidden if authenticated but not admin


4) Retrieve / Update / Delete user

- URL: `GET|PATCH|PUT|DELETE /api/users/users/<int:pk>/`
- Permission: owner-or-admin (custom `IsOwnerOrAdmin`) and authenticated

Rules:
- Admins can GET/PATCH/DELETE any user
- A user can GET/PATCH their own record (not another user's)
- DELETE is restricted to admin only (per the view logic)

- Example update (PATCH) body:

```json
{
  "first_name": "Zein",
  "last_name": "Y"
}
```

- Responses:
  - 200 OK for GET/PATCH
  - 204 No Content for successful DELETE (or 200 with message depending on view)
  - 403 Forbidden when user lacks permission
  - 404 Not Found when the user id does not exist

---

## curl Examples (copy & paste)

### 1) Register user `zeiny`

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zeiny","password":"zeiny123","email":"zeiny@example.com"}'
```

### 2) Login & get token

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zeiny","password":"zeiny123"}'
```

Look for `token` in the JSON response.

### 3) Use token to call protected endpoint (list users) as admin

```bash
curl -i -X GET http://127.0.0.1:8000/api/users/users/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

### 4) Create a user as admin

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"username":"dev1","password":"devpass","email":"dev1@example.com","role":"developer"}'
```

### 5) Get user detail (as owner or admin)

```bash
curl -i -X GET http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Authorization: Token <TOKEN>"
```

### 6) Update user (PATCH)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <TOKEN>" \
  -d '{"first_name":"Zein","last_name":"Y"}'
```

### 7) Delete user (admin only)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

---

## Responses & Error codes (summary)

- 200 OK — successful GET/POST login
- 201 Created — successful create (register or admin create)
- 204 No Content — successful delete (may vary)
- 400 Bad Request — validation errors
- 401 Unauthorized — missing/invalid token or invalid login credentials
- 403 Forbidden — authenticated but not allowed (role/permission)
- 404 Not Found — requested resource not found

---

## Role-based behavior (short)

- `admin`: full management: list users, create via management endpoint, update/delete any user.
- `developer`: limited — behaves like a normal user for ownership; may have additional privileges in other app areas.
- `user`: normal account with access to their own details only.

---

## Implementation notes & suggestions

- Tokens: tokens are created on login if they don't exist. Consider implementing token revocation (logout) by deleting the token on the server.
- Passwords: ensure strong password validation for production.
- Rate limiting & account lockout: add protections against brute-force login attempts.
- Pagination: add pagination to the users list if you expect many users.
- API versioning: consider prefixing with `/api/v1/users/` for future changes.

---

## Troubleshooting

- `401` on login: verify username/password; try registering first.
- `403` when calling list endpoint: ensure you're using an admin token.
- No token returned on login: check the `LoginView` response; if the token logic uses `rest_framework.authtoken`, ensure `rest_framework.authtoken` is in `INSTALLED_APPS` and migrations have been applied.

---

If you want, I can:

- Add a `logout/` endpoint that revokes tokens and include curl examples for logout.
- Add session/CSRF-based curl tests (cookie jar flow).
- Add OpenAPI/Swagger spec or a simple Postman collection.

---

Document created at `backend/api_docs/user_api.md`.
