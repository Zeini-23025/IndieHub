# Games API — curl test cases

Base URL (local dev server):

http://127.0.0.1:8000/api/games/

Notes
- The `games` app registers two routes:
  - `games` — full CRUD (create/update/delete/list/detail)
  - `games-list` — read-only list/retrieve for public consumption
- Use `Authorization: Token <TOKEN>` for authenticated requests. Make sure there's exactly one space after `Token`.
- Replace placeholders: `<DEV_TOKEN>`, `<ADMIN_TOKEN>`, `<GAME_ID>`, `<CATEGORY_ID>`, `<DEVELOPER_ID>`.

---

## 1) List public games (no auth)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/games-list/
```

Expected: HTTP 200. Anonymous users see only games with `status: "approved"`.

---

## 2) Retrieve a single game (public)

```bash
curl -i -L http://127.0.0.1:8000/api/games/games-list/<GAME_ID>/
```

Expected: HTTP 200 for approved games; 404/403 for non-approved when unauthenticated.

---

## 3) Create a game as a developer (authenticated)

Developer accounts are automatically set as the `developer` for created games when not provided.

Important: the API expects localized fields (`title_ar`, `description_ar`) and the game file uploaded with multipart/form-data. Use `-F` in curl and supply a real file path.

```bash
# create a small dummy file for local testing
touch /tmp/dummy_game.zip && echo "test" > /tmp/dummy_game.zip

curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -H "Authorization: Token <DEV_TOKEN>" \
  -F "title=My Dev Game" \
  -F "title_ar=لعبتي" \
  -F "description=A cool game by dev" \
  -F "description_ar=لعبة رائعة" \
  -F "category=<CATEGORY_ID>" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

Expected: HTTP 201 with created game JSON. The `developer` will be the authenticated user; `status` should default to `pending` (or your configured default).

---

3a) Create a game with a single category

```bash
# single category (one category id)
touch /tmp/dummy_game.zip && echo "test" > /tmp/dummy_game.zip

curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -H "Authorization: Token <DEV_TOKEN>" \
  -F "title=Single Cat Game" \
  -F "title_ar=لعبة بفئة واحدة" \
  -F "description=Game with one category" \
  -F "description_ar=لعبة مع فئة واحدة" \
  -F "category_ids=<CATEGORY_ID>" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

Expected: HTTP 201. The created game will have one category assigned.

3b) Create a game with multiple categories

```bash
# multiple categories: supply category_ids multiple times
touch /tmp/dummy_game.zip && echo "test" > /tmp/dummy_game.zip

curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -H "Authorization: Token <DEV_TOKEN>" \
  -F "title=Multi Cat Game" \
  -F "title_ar=لعبة بعدة فئات" \
  -F "description=Game with multiple categories" \
  -F "description_ar=لعبة مع عدة فئات" \
  -F "category_ids=<CATEGORY_ID_1>" \
  -F "category_ids=<CATEGORY_ID_2>" \
  -F "category_ids=<CATEGORY_ID_3>" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

Expected: HTTP 201. The created game will have the listed categories.

Note: some HTTP clients accept array-style fields (e.g. `category_ids[]=1&category_ids[]=2`) — repeat `category_ids` as needed for curl/multipart.


## 4) Create a game as admin (can set developer & status)

Admins may pass `developer` and `status`; still use multipart for files.

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -F "title=Admin Added Game" \
  -F "title_ar=لعبة المدير" \
  -F "description=Added by admin" \
  -F "description_ar=أضيفت من قبل المسؤول" \
  -F "category=<CATEGORY_ID>" \
  -F "developer=<DEVELOPER_ID>" \
  -F "status=approved" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

Expected: HTTP 201. Admin can set `developer` and `status`.

---

## 5) Update a game as its developer (owner)

Update simple JSON fields (no file):

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <DEV_TOKEN>" \
  -d '{"description":"Updated description by developer"}'
```

To update the uploaded file use multipart PATCH:

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Authorization: Token <DEV_TOKEN>" \
  -F "description=Updated description and file" \
  -F "file_path=@/tmp/dummy_game.zip;type=application/zip"
```

Expected: HTTP 200 on success. Developers cannot change `status` (see next).

---

## 6) Attempt to change status as developer (should fail)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <DEV_TOKEN>" \
  -d '{"status":"approved"}'
```

Expected: HTTP 403 Forbidden — only admins may change `status`.

---

## 7) Change status as admin (approve a game)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <ADMIN_TOKEN>" \
  -d '{"status":"approved"}'
```

Expected: HTTP 200 and `status` becomes `approved`.

---

## 8) Delete a game

As owner (developer) or admin:

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/games/games/<GAME_ID>/ \
  -H "Authorization: Token <DEV_OR_ADMIN_TOKEN>"
```

Expected: HTTP 204 No Content.

---

## 9) Unauthorized create attempt (anonymous or non-developer)

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/games/ \
  -F "title=Unauth Game" \
  -F "title_ar=لعبة" \
  -F "description=no auth"
```

Expected: HTTP 401 Unauthorized (or 403 if authenticated but not a developer/admin).

---

## 10) Quick token helpers (jq-friendly)

Get a developer token (example):

```bash
DEV_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"devuser","password":"<PASSWORD>"}' | jq -r '.token')
```

Get admin token:

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | jq -r '.token')
```

---

## 11) Troubleshooting & tips

- If curl reports "Failed to open/read local data from file/application", the file path is incorrect or unreadable. Create a dummy file and test:

```bash
touch /tmp/dummy_game.zip && echo "test" > /tmp/dummy_game.zip
ls -l /tmp/dummy_game.zip
```

- Ensure there is exactly one space after `Token` in the Authorization header:

```bash
-H "Authorization: Token <TOKEN>"
```

- If you receive validation errors (400), the response body lists required/missing fields — include that JSON when asking for help.

- If created games show `category` or `developer` as null, we added a data migration to assign defaults. Verify with the Django shell:

```bash
python3 backend/manage.py shell
>>> from games.models import Game
>>> for g in Game.objects.all()[:10]:
...     print(g.id, g.title, g.category_id, getattr(g.developer, 'id', None))
```

Save this file as `backend/games/game_test.md` and run the commands against your running dev server.
