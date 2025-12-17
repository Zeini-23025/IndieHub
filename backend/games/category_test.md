# Categories API - curl test cases

Base URL (assumes local dev server):

```
http://127.0.0.1:8000/api/games/
```

Notes:
- Categories are managed under the `games` app. There are two routers registered:
  - `categories` (admin-only, full CRUD via `CategoryViewSet`)
  - `categories-list` (read-only list/retrieve available to everyone)
- Use `Authorization: Token <ADMIN_TOKEN>` for admin-protected endpoints.
- Replace `<TOKEN>`, `<CATEGORY_ID>` with actual values returned by the server.

---

## 1) List public categories (no auth required)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/categories-list/
```

Expected: HTTP 200 with JSON array of categories.

---

## 2) Retrieve a single category (public)

```bash
curl -i -L  http://127.0.0.1:8000/api/games/categories-list/<CATEGORY_ID>/
```

Expected: HTTP 200 with category object.

---

## 3) Create a category (admin only)

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/categories/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"name":"Adventure","description":"Adventure games","name_ar":"مغامرة","description_ar":"ألعاب مغامرة"}'
```

Expected: HTTP 201 with created category JSON.

---

## 4) Update a category (admin only)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/categories/<CATEGORY_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"description":"Updated description"}'
```

Expected: HTTP 200 with updated category JSON.

---

## 5) Delete a category (admin only)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/games/categories/<CATEGORY_ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 204 No Content (or 200 with message depending on implementation).

---

## 6) Quick admin token helper (jq-friendly)

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | jq -r '.token')
```

---

## 7) Test access control

- Non-admin request to `POST /api/games/categories/` should return 403 Forbidden.
- Public users should be able to `GET /api/games/categories-list/` and `GET /api/games/categories-list/<id>/`.

Example: unauthorized create attempt

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/categories/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Action","description":"Action games"}'
```

Expected: HTTP 401 or 403 depending on authentication state.

---

## 8) Notes & troubleshooting

- Ensure `rest_framework.authtoken` is installed and you use a valid admin token for admin endpoints.
- If categories are empty after creating, check migrations and that the create request succeeded (201).
- If you need a non-token (session/CSRF) example, I can add cookie-jar style curl commands.

---

Save this file as `backend/games/category_test.md` and run the commands against your running dev server.
