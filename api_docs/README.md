# 📘 API Documentation – IndieHub

Welcome to the IndieHub API documentation. This file provides a compact, table-based reference for the project's main API endpoints. All routes are rooted at `/api/` (for example: `http://localhost:8000/api/`).

---

## 🔐 Authentication

| Method | URL                         | Description                                |
|-------:|-----------------------------|--------------------------------------------|
| POST   | `/api/users/register/`      | Create a user account (register)           |
| POST   | `/api/users/login/`         | Log in — returns a DRF token               |
| POST   | `/api/users/logout/`        | Log out (delete token)                     |

Note: include `Authorization: Token <TOKEN>` for authenticated requests.

---

## 🎮 Games

| Method | URL                                 | Description                                      |
|-------:|-------------------------------------|--------------------------------------------------|
| GET    | `/api/games/games-list/`            | Public list of approved games                    |
| GET    | `/api/games/games-list/{id}/`       | Public game detail                                |
| POST   | `/api/games/games/`                 | Submit a new game (developer) — multipart/form; use `category_ids` (one or more) to assign categories; responses include `categories` array |
| PATCH  | `/api/games/games/{id}/`            | Update a game (owner or admin)                    |
| DELETE | `/api/games/games/{id}/`            | Delete a game (owner or admin)                    |

Rule: `status` (pending/approved/rejected) is controlled by admins. Developers cannot set `status`.

---

## 🗂️ Categories

| Method | URL                                   | Description                    |
|-------:|---------------------------------------|--------------------------------|
| GET    | `/api/games/categories-list/`         | List categories (public)       |
| GET    | `/api/games/categories-list/{id}/`    | Category detail                 |
| POST   | `/api/games/categories/`              | Create category (admin only)    |
| PATCH  | `/api/games/categories/{id}/`         | Update (admin)                  |
| DELETE | `/api/games/categories/{id}/`         | Delete (admin)                  |

I18n fields available: `name_ar`, `description_ar`.

---

## 📚 Library

| Method | URL                                | Description                                         |
|-------:|------------------------------------|-----------------------------------------------------|
| GET    | `/api/library/entries/`            | List library entries (auth; admin sees all)         |
| POST   | `/api/library/entries/`            | Add a game to the authenticated user's library      |
| GET    | `/api/library/entries/{id}/`       | Retrieve a library entry                            |
| DELETE | `/api/library/entries/{id}/`       | Remove a library entry (owner or admin)             |

Note: `user` is set from the auth token automatically; do not include it in POST body.

---

## ⤓ Downloads

| Method | URL                                           | Description                                        |
|-------:|-----------------------------------------------|----------------------------------------------------|
| POST   | `/api/downloads/downloads/`                   | Create a download history record (anonymous or auth) |
| GET    | `/api/downloads/downloads/`                   | List download records (admin only)                 |
| GET    | `/api/downloads/popular-games/`               | List most popular games (by download count)        |
| GET    | `/api/downloads/games/{game_id}/download/`    | Protected game download (streams file; auth req)   |
| GET    | `/api/downloads/games/{game_id}/stats/`       | Game download metrics (total, last_30_days, daily series)

Rule: download allowed if the game is `approved`, or if the requester is the game's developer or an admin. Server logs `ip_address` and `device_info`.

Production note: for large files prefer X-Accel-Redirect, X-Sendfile, or pre-signed URLs (S3/MinIO) rather than streaming via Django.

---

## 🖼️ Screenshots

| Method | URL                                       | Description                                          |
|-------:|-------------------------------------------|------------------------------------------------------|
| GET    | `/api/games/screenshots/`                 | List screenshots (public)                             |
| GET    | `/api/games/screenshots/{id}/`            | Retrieve a screenshot                                 |
| POST   | `/api/games/screenshots/`                 | Upload a screenshot (game owner/developer or admin)  |
| PATCH  | `/api/games/screenshots/{id}/`            | Update screenshot (owner/admin)                       |
| DELETE | `/api/games/screenshots/{id}/`            | Delete screenshot (owner/admin)                       |

Rules:
- Exactly one screenshot per game should have `is_base = true`.
- Limit number of screenshots per game (e.g., max 4) and validate image types/sizes.

---

## ⭐ Reviews

| Method | URL                                         | Description                                          |
|-------:|---------------------------------------------|------------------------------------------------------|
| GET    | `/api/games/reviews-list/`                  | Public list of reviews (filter by game with `?game=`) |
| GET    | `/api/games/reviews-list/{id}/`             | Retrieve a single review                             |
| POST   | `/api/games/reviews/`                       | Create a review (authenticated users only)           |
| PATCH  | `/api/games/reviews/{id}/`                  | Update a review (owner or admin)                     |
| DELETE | `/api/games/reviews/{id}/`                  | Delete a review (owner or admin)                     |

Rules:
- `rating` must be an integer between 1 and 5.
- Each user may submit at most one review per game (unique constraint on `(game, user)`).
- `user` is set from the auth token and is read-only on the API.


## 👥 Users

| Method | URL                               | Description                                   |
|-------:|-----------------------------------|-----------------------------------------------|
| POST   | `/api/users/register/`            | Register (public)                             |
| POST   | `/api/users/login/`               | Log in — returns token                         |
| GET    | `/api/users/users/`               | List users (admin only)                        |
| GET    | `/api/users/users/{id}/`          | User detail (owner/admin)                      |
| PATCH  | `/api/users/users/{id}/`          | Update (owner/admin)                           |
| DELETE | `/api/users/users/{id}/`          | Delete (admin)                                 |

The `User` model contains a `role` field (`admin`, `developer`, `user`). Use `Authorization: Token <TOKEN>`.

---

## 📘 Interactive documentation

- Swagger UI: `http://127.0.0.1:8000/swagger/`
- ReDoc: `http://127.0.0.1:8000/redoc/`

---
