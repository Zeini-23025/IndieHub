# Reviews API — curl test cases

Base URL (local dev server):

http://127.0.0.1:8000/api/games/

Notes
- Reviews are managed under the `games` app. Routes used here:
  - `reviews-list` — public read-only list and retrieve
  - `reviews` — authenticated CRUD (owners & admins)
- Use `Authorization: Token <TOKEN>` for authenticated requests.
- Replace placeholders: `<TOKEN>`, `<REVIEW_ID>`, `<GAME_ID>`, `<ADMIN_TOKEN>`.

---

## 1) List public reviews (no auth)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/reviews-list/
```

Expected: HTTP 200 with JSON array of reviews. You can filter by game with `?game=`:

```bash
curl -i -X GET "http://127.0.0.1:8000/api/games/reviews-list/?game=<GAME_ID>"
```

---

## 2) Retrieve a single review (public)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/reviews-list/<REVIEW_ID>/
```

Expected: HTTP 200 with the review object. Example response (partial):

```json
{
  "id": 42,
  "game": 7,
  "user": 3,
  "user_username": "player3",
  "rating": 5,
  "comment": "Loved it!",
  "created_at": "2026-01-02T12:34:56Z",
  "updated_at": "2026-01-02T12:34:56Z"
}
```

---

## 3) Create a review (authenticated user)

Fields accepted by the reviews serializer:

- `rating` (integer, required) — 1..5
- `comment` (string, optional)
- `game` (integer, required) — the game id being reviewed

Example (JSON):

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/reviews/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <TOKEN>" \
  -d '{"rating":5, "comment":"Loved it!", "game": <GAME_ID> }'
```

Expected: HTTP 201 Created with created review JSON (server sets `user`). Example response:

```json
{
  "id": 123,
  "game": <GAME_ID>,
  "user": 7,
  "user_username": "player7",
  "rating": 5,
  "comment": "Loved it!",
  "created_at": "2026-01-02T12:34:56Z",
  "updated_at": "2026-01-02T12:34:56Z"
}
```

Notes: the `user` field is read-only and will be filled from your token; the response includes `user_username` for convenience.

---

## 4) Update a review (owner)

Only the review owner (or an admin) may edit their review.

Partial update example:

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/reviews/<REVIEW_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <TOKEN>" \
  -d '{"rating":4, "comment":"Updated: still great"}'
```

Expected: HTTP 200 with updated review JSON.

---

## 5) Delete a review (owner or admin)
```bash
# Simple delete (replace <REVIEW_ID> and provide a valid token)
curl -i -X DELETE "http://127.0.0.1:8000/api/games/reviews/<REVIEW_ID>/" \
  -H "Authorization: Token <TOKEN_OR_ADMIN>"
```

Expected: HTTP 204 No Content (or 200 depending on implementation).

Example: create then delete as the owner (shell-friendly)

```bash
# create a review and capture its id (requires jq)
curl -s -X POST http://127.0.0.1:8000/api/games/reviews/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <TOKEN>" \
  -d '{"rating":5, "comment":"Temp review", "game": <GAME_ID> }

# delete the review as the owner
curl -i -X DELETE "http://127.0.0.1:8000/api/games/reviews/<REVIEW_ID>/" \
  -H "Authorization: Token <TOKEN>"

# expected response starts with: HTTP/1.1 204 No Content
```

Example: delete as an admin (one-off)

```bash
# delete review with id 1 as admin
curl -i -X DELETE "http://127.0.0.1:8000/api/games/reviews/REVIEW_ID/" \
  -H "Authorization: Token <ADMIN_TOKEN>"

# expected response: HTTP/1.1 204 No Content (or 200)
```

---

## 6) Admin actions

Admins can manage all reviews via the authenticated `reviews` endpoint. Example: list all reviews as admin

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/reviews/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

And delete any review as admin (same DELETE as above using the admin token).

---

## 7) Unauthorized create attempt (anonymous)

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/reviews/ \
  -H "Content-Type: application/json" \
  -d '{"rating":5, "comment":"Nice!", "game": <GAME_ID> }'
```

Expected: HTTP 401 Unauthorized (or 403 if your API requires a specific role).

---

## 8) Quick token helper (jq-friendly)

Get a user token (example):

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"devuser","password":"<PASSWORD>"}' | jq -r '.token')

echo $TOKEN
```

---

## 9) Troubleshooting & tips

- Ratings validation: if you receive a 400 error, the response body will indicate field validation (e.g. rating out of range).
- Duplicate reviews: the serializer rejects creating a second review by the same user for the same game.
- Permissions: ensure the token user owns the review when attempting PATCH/DELETE; admins can manage any review.
- Filtering & pagination: use `?game=<GAME_ID>` to filter reviews for a specific game and `?page=` for pagination if enabled.

Save this file as `backend/games/reviews_test.md` and run the commands against your running dev server.
