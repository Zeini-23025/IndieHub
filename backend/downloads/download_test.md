# Downloads API - curl test cases

Base URL (local dev server):

```
http://127.0.0.1:8000/api/downloads/
```

Notes:
- Downloads are handled under the `downloads` app.
- There is a `DownloadHistoryViewSet` registered (likely at `download-history` or similar) for creating download records and an authenticated protected download endpoint implemented elsewhere under `api/downloads/games/<game_id>/download/` (if present in your routes).
- Use `Authorization: Token <TOKEN>` for authenticated requests where required.
- Replace placeholders like `<TOKEN>`, `<GAME_ID>` with actual values returned by the server.

---

## 1) Create a DownloadHistory record (anonymous allowed)

This endpoint records metadata about a download (ip, device). According to the viewset, anyone may create a record.

```bash
curl -i -X POST http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Content-Type: application/json" \
  -d '{"game": 1, "user": null, "device_info":"curl test"}'
```

Expected: HTTP 201 with created DownloadHistory JSON (ip and device_info will be populated server-side).

Authenticated (create download record tied to the token user)

```bash
curl -i -X POST http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <USER_TOKEN>" \
  -d '{"game": 1, "device_info":"curl test (auth)"}'
```

Expected: HTTP 201 with created DownloadHistory JSON. The `user` field in the response should show the authenticated user's id (the serializer sets it server-side from the token).

---

## 2) List download records (admin only)

```bash
curl -i -X GET http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 200 with array of download records. Non-admins should receive 403 Forbidden.

---

## 3) Retrieve a single download record (admin only)

```bash
curl -i -X GET http://127.0.0.1:8000/api/downloads/downloads/<ID>/ \
  -H "Authorization: Token <ADMIN_TOKEN>"
```

Expected: HTTP 200 for admins; 403 for non-admins.

---

## 4) Protected game file download via API (authenticated required)

If you implemented the `DownloadGameView` (streams file and logs a DownloadHistory entry) it will typically be available at a route like:

```
/api/downloads/games/<GAME_ID>/download/
```

Authenticated user download example (Token auth):

```bash
curl -i -L -X GET http://127.0.0.1:8000/api/downloads/games/<GAME_ID>/download/ \
  -H "Authorization: Token <USER_TOKEN>"
```

Expected: HTTP 200 with file stream (or 302/X-Accel redirect depending on your production config). A DownloadHistory row should be created for this download with the user's id, ip and device_info.

---

## 5) Unauthenticated download attempt (should be denied)

If the download endpoint requires authentication, an unauthenticated request should return 401 or 403. Test:

```bash
curl -i -L -X GET http://127.0.0.1:8000/api/downloads/games/<GAME_ID>/download/
```

Expected: HTTP 401 Unauthorized (or 403 Forbidden) and no DownloadHistory row with a user id.

---

## 6) Verify DownloadHistory logging

After performing a protected download, verify the record was created (admin token helper shown below):

```bash
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}' | jq -r '.token')

curl -i -X GET http://127.0.0.1:8000/api/downloads/downloads/ \
  -H "Authorization: Token $ADMIN_TOKEN"
```

Look for an entry with the `game` id you downloaded and the `user` id or null if unauthenticated.

---

## 7) Notes & production considerations

- If your MEDIA files are served publicly by the webserver (nginx, dev server), protecting only the API endpoint will NOT prevent anonymous direct downloads. The file storage / webserver must be configured to block direct public access.
- For production secure delivery consider one of the following:
  - X-Accel-Redirect / X-Sendfile with nginx/Apache and an internal protected location.
  - Store files in S3 (or other object store) and return presigned URLs for downloads.
  - Keep files behind Django and stream them through a protected view (less efficient for large files) and ensure your static/media hosting is not publicly accessible.

- If you use Django's dev server for local testing it will serve media directly from MEDIA_URL; that can mask access control issues that appear in production.

---

Save this file as `backend/downloads/download_test.md` and run the commands against your running dev server. Adjust route paths if your project registers different router names (e.g., `download-history` vs `downloadhistory`).
