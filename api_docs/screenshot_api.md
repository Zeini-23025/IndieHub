# Screenshot API

Overview

The Screenshot API allows clients to list and manage screenshots for games. Screenshots belong to a `Game` and include an image file, upload timestamp and a boolean `is_base` flag indicating the game's primary screenshot. Each game must have exactly one `is_base = true` screenshot (enforced at the model/DB or serializer level). The API supports listing and retrieving screenshots for public consumption, while create/update/delete are restricted to game developers (owners) and admins.

Base URL

All endpoints are mounted under the project's API root. Example base path used here:

`/api/games/screenshots/`

Models / Fields

Screenshot
- id: integer (read-only)
- game: integer (ForeignKey to `games.Game`) — ID of the related game
- image_path: string / file — path to the uploaded image file (URL returned by serializer)
- is_base: boolean — whether this screenshot is the base screenshot for the game
- uploaded_at: datetime (ISO 8601)

Permissions summary
- List & Retrieve: Allow any authenticated or anonymous users (read-only public)
- Create: Only the developer who owns the `Game` or an admin may upload screenshots for that game
- Update & Partial Update: Only owner (developer) or admin
- Delete: Only owner (developer) or admin

Business rules & validation
- Each game should have at most 4 screenshots. Clients should not upload more than 4; the API may reject requests that would exceed this limit.
- Exactly one screenshot per game must have `is_base = true`. When creating or updating a screenshot to `is_base=true`, the server must unset `is_base` on the previous base screenshot for that game (or the request will be rejected if DB-level constraint is enforced).
- Image content-type and size restrictions should be enforced by the server (e.g., allowed MIME types: `image/png`, `image/jpeg`; max size configurable).

Endpoints

1) List screenshots

- URL: GET /api/games/screenshots/
- Permissions: read-only (public)
- Query params (optional): `game=<id>` — filter screenshots by game ID
- Response: 200 OK
- Example:

curl -sS -X GET "http://localhost:8000/api/games/screenshots/" | jq

2) Retrieve a screenshot

- URL: GET /api/games/screenshots/{id}/
- Permissions: read-only (public)
- Response: 200 OK or 404 Not Found
- Example:

curl -sS -X GET "http://localhost:8000/api/games/screenshots/1/" | jq

3) Create (upload) a screenshot

- URL: POST /api/games/screenshots/
- Permissions: developer (owner of the referenced game) or admin
- Content-Type: multipart/form-data
- Form fields:
  - `game`: integer (game id)
  - `image_path`: file (binary)
  - `is_base`: boolean (optional; default false) — when true, server should ensure this becomes the single base for the game
- Response: 201 Created (returns created screenshot object)
- Example (developer uploads a screenshot):

curl -X POST "http://localhost:8000/api/games/screenshots/" \
  -H "Authorization: Token <DEV_TOKEN>" \
  -F "game=5" \
  -F "image_path=@/path/to/screenshot1.png" \
  -F "is_base=true"

Server returns JSON like:
{
  "id": 123,
  "game": 5,
  "image_path": "http://localhost:8000/media/screenshots/screenshot1.png",
  "is_base": true,
  "uploaded_at": "2025-12-30T12:34:56Z"
}

Notes on multipart/file uploads
- Ensure the file field name matches the serializer's `image_path` field.
- Use the `Authorization: Token <token>` header for authenticated requests. Do not include extra whitespace.

4) Update a screenshot (full replace)

- URL: PUT /api/games/screenshots/{id}/
- Permissions: developer (owner) or admin
- Body: multipart/form-data when replacing the file; otherwise JSON can be used for boolean fields
- Example (set is_base to false):

curl -X PUT "http://localhost:8000/api/games/screenshots/123/" \
  -H "Authorization: Token <DEV_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_base": false}'

5) Partial update

- URL: PATCH /api/games/screenshots/{id}/
- Permissions: developer (owner) or admin
- Example (make this the base screenshot):

curl -X PATCH "http://localhost:8000/api/games/screenshots/123/" \
  -H "Authorization: Token <DEV_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"is_base": true}'

If the backend enforces a DB-level unique constraint for base screenshots, the PATCH may fail with a 400/409 unless the server transaction unsets the previous base first.

6) Delete a screenshot

- URL: DELETE /api/games/screenshots/{id}/
- Permissions: developer (owner) or admin
- Response: 204 No Content
- Example:

curl -X DELETE "http://localhost:8000/api/games/screenshots/123/" \
  -H "Authorization: Token <DEV_TOKEN>"

Error handling and common responses
- 400 Bad Request: validation failed (e.g., upload exceeds allowed size, invalid MIME type, too many screenshots for the game, attempt to create a second base without unsetting the previous one)
- 401 Unauthorized: missing or invalid token for write operations
- 403 Forbidden: authenticated user is not the game owner or admin
- 404 Not Found: screenshot id or referenced game not found

Example scenario: ensure exactly one base
1. A developer uploads the first screenshot and sets `is_base=true`. Server accepts it.
2. When the developer uploads a second screenshot and sets `is_base=true`, the server must either:
   - Within a transaction unset the previous base and set the new one (preferred).
   - Or reject the request with a clear error pointing out that a base already exists.

Notes for deploy / production
- Image storage: screenshots are stored using Django's configured storage backend (default: local `MEDIA_ROOT`). In production, prefer object storage (S3) with signed URLs for media protection if you need to restrict direct access.
- Serving protected media: If screenshots must be protected, use webserver-level protected routes (e.g., Nginx X-Accel-Redirect) or generate short-lived signed URLs from your storage provider. The API itself returns metadata and must not assume media is private unless the storage and webserver are configured.

Related endpoints
- Game endpoints: `/api/games/` — used to verify the game and developer ownership
- Download endpoints (if you allow screenshot downloads): `/api/downloads/games/{id}/download/` — for protected game file downloads (game binary)

FAQ / Troubleshooting
- "I get a DB error about `is_base` column missing": Run Django migrations to apply the model change that added `is_base` to the `Screenshot` model.
- "Uploads fail with 413 / connection reset": Check server upload limits (Nginx `client_max_body_size`) and Django storage backend configuration.

Change log
- 2025-12-30: Initial creation. Includes field/permission notes and examples for multipart uploads and base-screenshot handling.

