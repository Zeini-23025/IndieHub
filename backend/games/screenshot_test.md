# Screenshots API - curl test cases

Base URL (local dev server):

```
http://127.0.0.1:8000/api/games/
```

Notes:
- Screenshots are managed under the `games` app and registered at the `screenshots` router.
- Public access to screenshots is denied by default; only admins and developers (for their own games) may list/create/update/delete screenshots.
- Replace placeholders: `<ADMIN_TOKEN>`, `<DEV_TOKEN>`, `<GAME_ID>`, `<SCREENSHOT_ID>`.

---

## 1) List screenshots (admin only)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/screenshots/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 200 with array of screenshot objects. Non-admins should receive 403 or an empty list depending on role.

---

## 2) Retrieve a single screenshot (admin or owner developer)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/screenshots/<SCREENSHOT_ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 200 for admins or the developer who owns the game's screenshot. Public/other developers should receive 403.

---

## 3) Create a screenshot (developer for own game / admin)

Uploading a screenshot uses multipart/form-data and an `ImageField`. Developers may only add screenshots to their own games; admins can add to any game.

```bash
# create a small dummy image for testing
convert -size 320x240 xc:skyblue /tmp/dummy_shot.jpg || true

curl -i -X POST http://127.0.0.1:8000/api/games/screenshots/ \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>" \
  -F "game=<GAME_ID>" \
  -F "image_path=@/tmp/dummy_shot.jpg;type=image/jpeg" \
  -F "is_base=false"
```

Notes:
- `is_base` can be `true` or `false`. The database enforces at most one `is_base=true` per game; creating a second base image will cause a DB error/validation failure.
- The serializer marks `id` and `uploaded_at` read-only; do not send them in the payload.

Expected: HTTP 201 with created screenshot JSON.

---

## 4) Create screenshot as admin and mark as base

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/screenshots/ \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -F "game=<GAME_ID>" \
  -F "image_path=@/tmp/dummy_shot.jpg;type=image/jpeg" \
  -F "is_base=true"
```

Expected: HTTP 201 if no other base exists for the game. If a base already exists, expect a 400/500 depending on how the backend reports the constraint violation.

---

## 5) Update a screenshot (change is_base or replace image)

Change `is_base` (admin or developer-owner):

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/screenshots/<SCREENSHOT_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"is_base": false}'
```

Replace the uploaded image with multipart PATCH:

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/screenshots/<SCREENSHOT_ID>/ \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>" \
  -F "image_path=@/tmp/new_shot.jpg;type=image/jpeg"
```

Expected: HTTP 200 on success. Be mindful of the unique-base constraint when setting `is_base=true`.

---

## 6) Delete a screenshot (owner or admin)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/games/screenshots/<SCREENSHOT_ID>/ \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>"
```

Expected: HTTP 204 No Content on success.

---

## 7) Permission checks

- Developers may only manage screenshots for games where they are the `developer` (owner). Attempts to add screenshots to another developer's game should return 403 with a message.
- Admins may manage screenshots across all games.
- Public users (no token) have no access to these endpoints and should receive 401/403.

Example: developer attempting to add screenshot to another's game

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/screenshots/ \
  -H "Authorization: Token <DEV_TOKEN_OF_OTHER>" \
  -F "game=<GAME_ID_NOT_OWNED>" \
  -F "image_path=@/tmp/dummy_shot.jpg;type=image/jpeg"
```

Expected: HTTP 403 Forbidden with a helpful message.

---

## 8) Quick token helper (jq-friendly)

```bash
DEV_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"developer1","password":"dev1123"}' | jq -r '.token')

ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
```

---

## 9) Notes & troubleshooting

- The DB enforces at most one `is_base` per game via a conditional unique constraint. If you get constraint errors when creating or updating, inspect existing screenshots for the game and unset the previous base first.
- If image uploads fail (400), confirm `Content-Type`/multipart usage and that the test image file paths exist locally.
- If a screenshot is not visible in admin/API, ensure you are authenticated as an admin or the game developer.

---

Save this file as `backend/games/screenshot_test.md` and run the commands against your running dev server. Adjust placeholders and file paths as needed.
