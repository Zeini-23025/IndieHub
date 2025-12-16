# Users API - curl test cases

Base URL (assumes local dev server):

```
http://127.0.0.1:8000/api/users/
```

Notes:
- This project exposes a token-based login endpoint at `/api/users/login/` which returns a DRF Token.
- Use the header `Authorization: Token <token>` on subsequent requests.
- Endpoints covered below: register, login (token), users list (admin only), user detail (owner or admin), create user (admin), update, delete.

Replace `<TOKEN>` and `<USER_ID>` with values returned by the server.

---

## 1) Register new user (public)

Register `zeiny` with password `zeiny123`:

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zeiny","password":"zeiny123","email":"zeiny@example.com"}'
```

Expected: HTTP 201 with user data (password not returned).

Save returned user `id` for later (or use the login response to see `user.id`).

---

## 2) Login to get token

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zeiny","password":"zeiny123"}'
```

Expected: HTTP 200 with JSON like:

```json
{ "token": "<TOKEN>", "user": { "id": 5, "username": "zeiny", ... } }
```

Copy the token for authenticated requests.

---

## 3) Try to list users as regular user (should be forbidden)

```bash
curl -i -X GET http://127.0.0.1:8000/api/users/users/ \
  -H "Authorization: Token <TOKEN>"
```

Expected: HTTP 403 or 401 since only admins should list all users.

---

## 4) Create an admin account (two options)

Option A — create superuser using manage.py (recommended during dev):

Run this (it will prompt for password):

```bash
cd /home/zeiny/IndieHub/backend
/home/zeiny/IndieHub/venv/bin/python manage.py createsuperuser --username admin --email admin@example.com
```

Option B — if you cannot run createsuperuser, create a user via register then set role/is_staff/is_superuser in Django shell:

```bash
/home/zeiny/IndieHub/venv/bin/python manage.py shell
>>> from users.models import User
>>> u = User.objects.create_user('admin2', email='a2@example.com', password='adminpass')
>>> u.role = 'admin'
>>> u.is_staff = True
>>> u.is_superuser = True
>>> u.save()
```

---

## 5) Login as admin and get token

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}'
```

The response contains `token` for admin.

---

## 6) As admin: list users (should succeed)

```bash
curl -i -X GET http://127.0.0.1:8000/api/users/users/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 200 with a JSON list of users.

---

## 7) As admin: create a developer and a regular user via management endpoint

Create developer `dev1`:

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"username":"dev1","password":"devpass","email":"dev1@example.com","role":"developer"}'
```

Create regular user `bob`:

```bash
curl -i -X POST http://127.0.0.1:8000/api/users/users/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"username":"bob","password":"bobpass","email":"bob@example.com","role":"user"}'
```

Note: If the management create endpoint enforces Admin-only, requests without admin token will be rejected.

---

## 8) Read / Update / Delete user detail

Get user detail (any authenticated user can retrieve their own resource; admin can retrieve any):

```bash
# As owner (use user's token):
curl -i -X GET http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Authorization: Token <USER_TOKEN>"

# As admin:
curl -i -X GET http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Update user (PATCH example):

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <USER_TOKEN>" \
  -d '{"first_name":"Zein","last_name":"Y"}'
```

Delete user (admin only):

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/users/users/<USER_ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

---

## 9) Test role-based behavior (user vs developer vs admin)

1. Register/login three accounts (or create them via admin):
   - admin (role=admin) -> get ADMIN_TOKEN
   - dev1 (role=developer) -> get DEV_TOKEN
   - zeiny (role=user) -> get USER_TOKEN

2. Observations to test:
   - List users (`GET /users/`) should succeed only for ADMIN_TOKEN.
   - Retrieve another user's detail should succeed for ADMIN_TOKEN, fail for USER_TOKEN unless the user is the owner.
   - Update another user's detail should succeed for ADMIN_TOKEN, fail for non-admins (owner can update themselves).

Example attempts:

```bash
# dev tries to list users (should be forbidden):
curl -i -X GET http://127.0.0.1:8000/api/users/users/ \
  -H "Authorization: Token <DEV_TOKEN>"

# user tries to delete someone (should be forbidden):
curl -i -X DELETE http://127.0.0.1:8000/api/users/users/<OTHER_USER_ID>/ \
  -H "Authorization: Token <USER_TOKEN>"
```

---

## 10) Utility: get token programmatically (jq-friendly)

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"zeiny","password":"zeiny123"}' | jq -r '.token')
echo $TOKEN
```

---

If you'd like, I can:
- Add a `logout/` endpoint that deletes the token server-side (for token revocation).
- Add CSRF/session-based curl examples if you prefer cookie-based auth.

Save this file as `backend/users/user_test.md` and run the commands against your running dev server.
