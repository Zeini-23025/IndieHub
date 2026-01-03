```markdown
# Reviews API Documentation

Base URL (dev):

```
http://127.0.0.1:8000/api/games/
```

This document describes the Reviews API implemented in the `games` Django app. It covers endpoints, request/response bodies, authentication, permissions, example curl calls, and common errors.

---

## Overview

The Reviews API allows authenticated users to create reviews for games and allows owners/admins to manage them. Public read-only endpoints expose reviews for consumption (filterable by game).

Routes (router registrations):
- `reviews` — authenticated CRUD (backed by a ViewSet); owners and admins may edit/delete.
- `reviews-list` — public read-only list/retrieve (backed by a read-only viewset/list view).

Review fields (exposed by `ReviewSerializer`):
- `id` (integer) — read-only
- `game` (integer) — the reviewed game's id (write/read)
- `user` (integer) — read-only user id (set from token)
- `user_username` (string) — convenience field in responses
- `rating` (integer) — 1..5 (validated by serializer)
- `comment` (string) — optional
- `created_at` / `updated_at` (timestamps)

---

## Authentication & Permissions

- Authentication: token-based (DRF TokenAuth). Use header:

```
Authorization: Token <TOKEN>
```

- Permissions:
  - Anonymous users: may list and retrieve reviews via `reviews-list`.
  - Authenticated users: may create one review per game (serializer prevents duplicates).
  - Review owner: may update/delete their own review.
  - Admins: may manage all reviews.

---

## Endpoints

1) Public list reviews

- URL: `GET /api/games/reviews-list/`
- Permission: AllowAny
- Query parameters: `?game=<game_id>` to filter reviews for a single game

2) Retrieve a single review

- URL: `GET /api/games/reviews-list/<int:pk>/`
- Permission: AllowAny

3) Create a review

- URL: `POST /api/games/reviews/`
- Permission: authenticated users
- Request body (JSON):

```
{
  "game": <GAME_ID>,
  "rating": 5,
  "comment": "Great game!"
}
```

Notes: `user` is read-only and automatically set from the token. Rating is validated (1..5) and creating a second review for the same (game, user) is rejected.

4) Update a review (owner or admin)

- URL: `PATCH /api/games/reviews/<int:pk>/`
- Permission: owner or admin

5) Delete a review (owner or admin)

- URL: `DELETE /api/games/reviews/<int:pk>/`
- Permission: owner or admin

---

## curl Examples

Replace placeholders: `<TOKEN>`, `<ADMIN_TOKEN>`, `<GAME_ID>`, `<REVIEW_ID>`.

1) List public reviews

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/reviews-list/
```

Filter by game:

```bash
curl -i -X GET "http://127.0.0.1:8000/api/games/reviews-list/?game=<GAME_ID>"
```

2) Retrieve a single review

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/reviews-list/<REVIEW_ID>/
```

3) Create a review (authenticated)

```bash
curl -i -X POST http://127.0.0.1:8000/api/games/reviews/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <TOKEN>" \
  -d '{"rating":5, "comment":"Loved it!", "game": <GAME_ID> }'
```

Expected: HTTP 201 with the created review. `user` is set from your token; response includes `user_username`.

4) Update a review (owner)

```bash
curl -i -X PATCH http://127.0.0.1:8000/api/games/reviews/<REVIEW_ID>/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <TOKEN>" \
  -d '{"rating":4, "comment":"Updated comment"}'
```

5) Delete a review (owner or admin)

```bash
curl -i -X DELETE http://127.0.0.1:8000/api/games/reviews/<REVIEW_ID>/ \
  -H "Authorization: Token <TOKEN_OR_ADMIN>"
```

6) Admin: list all reviews (authenticated)

```bash
curl -i -X GET http://127.0.0.1:8000/api/games/reviews/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

---

## Responses & error codes

- 200 OK — successful GET/PATCH
- 201 Created — successful create
- 204 No Content — successful delete
- 400 Bad Request — validation errors (e.g. rating out of range, duplicate review)
- 401 Unauthorized — missing/invalid token on authenticated endpoints
- 403 Forbidden — authenticated but not allowed (e.g. editing someone else's review)
- 404 Not Found — resource doesn't exist

---

## Notes & tips

- Validation errors include field-level messages in the response body.
- The serializer prevents duplicate reviews by the same user for the same game — repeated POST attempts will return 400 with a helpful message.
- Use `?game=<GAME_ID>` to filter reviews by game. Pagination may be enabled on list endpoints.

Document created at `api_docs/reviews_api.md`.

```
