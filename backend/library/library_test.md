# Library API — curl test cases

Base URL (local dev server):

http://127.0.0.1:8000/api/library/

Notes
- The `library` app registers routes for `entries` (user library entries).
- Use `Authorization: Token <TOKEN>` for authenticated requests. Make sure there's exactly one space after `Token`.
- Replace placeholders: `<USER_TOKEN>`, `<ADMIN_TOKEN>`, `<GAME_ID>`, `<ENTRY_ID>`.

---

## 1) List the authenticated user's library entries (requires login)

```bash
curl -i -X GET http://127.0.0.1:8000/api/library/entries/ \
  -H "Authorization: Token <USER_TOKEN>"
```

Expected: HTTP 200. Authenticated users see only their own entries; admins (role 'admin') see all entries.

---

## 2) Add a game to your library (authenticated)

Only logged-in users can add games to their library. The API expects a JSON body with the game primary key. Only games with `status: "approved"` may be added by default.

```bash
curl -i -X POST http://127.0.0.1:8000/api/library/entries/ \
  -H "Authorization: Token <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"game": <GAME_ID>}'
```

Expected: HTTP 201 with created library entry JSON (nested `game` details included). The `user` is set by the server from the token.

---

## 3) Attempt to add without logging in (anonymous)

```bash
curl -i -X POST http://127.0.0.1:8000/api/library/entries/ \
  -H "Content-Type: application/json" \
  -d '{"game": <GAME_ID>}'
```

Expected: HTTP 401 Unauthorized.

---

## 4) Attempt to add the same game twice (duplicate)

Add twice with the same `<GAME_ID>` and `<USER_TOKEN>`; the second attempt should fail.

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

Expected second response: HTTP 400 with JSON: {"detail":"This game is already in your library."}

---

## 5) Retrieve a library entry (owner or admin)

```bash
curl -i -X GET http://127.0.0.1:8000/api/library/entries/<ENTRY_ID>/ \
  -H "Authorization: Token <USER_TOKEN>"
```

Expected: HTTP 200 if the requesting user is the owner or an admin. Otherwise 403/404.

---

## 6) Remove a library entry (owner or admin)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/library/entries/<ENTRY_ID>/ \
  -H "Authorization: Token <USER_TOKEN>"
```

Expected: HTTP 204 No Content when the owner or an admin deletes the entry.

---

## 7) Quick token helpers (jq-friendly)

Get a user token (example):

```bash
USER_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"<PASSWORD>"}' | jq -r '.token')
```

Get admin token:

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | jq -r '.token')
```

---

## 8) Notes & troubleshooting

- The library create endpoint uses the serializer's HiddenField to set the `user` based on the authenticated token. If the request is unauthenticated the request will be rejected (401).
- By default only approved games (status `approved`) are allowed to be added to a library. If you need to allow adding pending/rejected games for developers/admins, I can change that behavior.
- If you see validation errors (400), include the response JSON when asking for help.

Save this file as `backend/library/library_test.md` and run the commands against your local dev server.
