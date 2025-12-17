# Categories API Documentation

Base URL (dev):

```
http://127.0.0.1:8000/api/games/
```

This document describes the Categories API implemented in the `games` Django app. It covers endpoints, request/response bodies, authentication, permissions, example curl calls, and common errors.

---

## Overview

The Categories API provides CRUD operations for game categories and a public read-only listing.

There are two router registrations:
- `categories` — full CRUD, backed by `CategoryViewSet`, admin-only.
- `categories-list` — read-only list/retrieve, backed by `CategoryListView`, public.

Category fields (exposed by `CategorySerializer`):
- `id` (integer) — read-only
- `name` (string) — category name
- `description` (string) — optional description
- `name_ar` (string) — Arabic name (i18n)
- `description_ar` (string) — Arabic description (i18n)

---

## Authentication & Permissions

- Admin endpoints (create/update/delete) require token authentication and the custom `IsAdminUser` permission.
- Public list/retrieve endpoints require no authentication.

Auth header for token-based access:

```
Authorization: Token <TOKEN>
```

(Include a single space between `Token` and the token value.)

---

## Endpoints

1) Public list categories

- URL: `GET /api/games/categories-list/`
- Permission: AllowAny
- Response (200 OK): array of category objects

Example:

```json
[
  { "id": 1, "name": "Action", "description": "Action games", "name_ar": "أكشن", "description_ar": "..." },
  { "id": 2, "name": "Adventure", "description": "Adventure games", ... }
]
```


2) Public retrieve a category

- URL: `GET /api/games/categories-list/<int:pk>/`
- Permission: AllowAny
- Response (200 OK): single category object


3) Create category (admin)

- URL: `POST /api/games/categories/`
- Permission: `IsAdminUser` + authenticated
- Request body (JSON):

```json
{
  "name": "Adventure",
  "description": "Adventure games",
  "name_ar": "مغامرة",
  "description_ar": "ألعاب مغامرة"
}
```

- Response (201 Created): created category JSON
- Errors: 400 validation errors, 401 missing/invalid auth, 403 not admin


4) Update category (admin)

- URL: `PATCH /api/games/categories/<int:pk>/`
- Permission: `IsAdminUser` + authenticated
- Request body (partial update allowed):

```json
{ "description": "Updated description" }
```

- Response (200 OK): updated category JSON


5) Delete category (admin)

- URL: `DELETE /api/games/categories/<int:pk>/`
- Permission: `IsAdminUser` + authenticated
- Response: 204 No Content (or 200 depending on implementation)

---

## curl Examples (copy & paste)

### 1) List public categories

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/categories-list/
```

### 2) Retrieve a category (follow redirect or include trailing slash)

```bash
# recommended: include trailing slash
curl -i -X GET http://127.0.0.1:8000/api/games/categories-list/2/

# or follow redirects if you omit slash
curl -i -L http://127.0.0.1:8000/api/games/categories-list/2
```

### 3) Login and get admin token (jq-friendly)

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | jq -r '.token')
```

### 4) Create a category (admin)

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/categories/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token $ADMIN_TOKEN" \
  -d '{"name":"Adventure","description":"Adventure games","name_ar":"مغامرة","description_ar":"ألعاب مغامرة"}'
```

### 5) Update a category (admin)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/categories/2/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token $ADMIN_TOKEN" \
  -d '{"description":"Updated description"}'
```

### 6) Delete a category (admin)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/games/categories/2/ \
  -H "Authorization: Token $ADMIN_TOKEN"
```

---

## Responses & Error codes (summary)

- 200 OK — successful GET/PATCH
- 201 Created — successful create
- 204 No Content — successful delete (may vary)
- 400 Bad Request — validation errors
- 401 Unauthorized — missing/invalid token
- 403 Forbidden — authenticated but not admin
- 404 Not Found — requested resource not found

---

## Notes, best practices & suggestions

- Trailing slash: DRF routers use trailing slashes by default. Either call endpoints with the trailing slash or use `-L` with curl to follow redirects. If you prefer no trailing slashes, set `DefaultRouter(trailing_slash=False)` in `games/urls.py` (affects all routes) or set `APPEND_SLASH=False` in settings (not generally recommended).

- I18n: `name_ar` and `description_ar` allow Arabic translations — keep consistent validation for required/optional fields.

- Soft delete: consider soft-delete for categories if you want to preserve relationships and avoid FK issues when deleting.

- Pagination: consider adding pagination to the public list if you expect many categories.

- Validation: ensure `name` uniqueness if desired (model/db constraint) to prevent duplicate categories.

---

## How to test locally

1. Apply migrations and start server:

```bash
cd backend
source ../venv/bin/activate  # or your venv
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver
```

2. Use the curl examples above to exercise endpoints.

3. Admin creation: create a superuser with `python manage.py createsuperuser` or create a user and set role/is_staff/is_superuser in the shell.

---

If you want, I can:
- Add session/CSRF cookie-based curl examples (cookie-jar flow) for browser-like testing.
- Add an OpenAPI snippet or Postman collection for these endpoints.

Document created at `backend/api_docs/category_api.md`.
