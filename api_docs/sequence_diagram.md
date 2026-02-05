# Sequence Diagrams

These diagrams illustrate the main interaction flows within the IndieHub system.

## 1. User Registration

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API
    participant DB

    User->>Frontend: Fills Registration Form
    Frontend->>API: POST /api/users/register/ (username, password, role)
    API->>DB: Check if username exists
    alt Username taken
        DB-->>API: Exists
        API-->>Frontend: 400 Bad Request
        Frontend-->>User: Show Error "Username taken"
    else Username available
        API->>DB: Create User
        DB-->>API: User Created
        API-->>Frontend: 201 Created (User Data + Token)
        Frontend-->>User: Redirect to Dashboard
    end
```

## 2. Game Submission (Developer)

```mermaid
sequenceDiagram
    actor Developer
    participant Frontend
    participant API
    participant DB

    Developer->>Frontend: Fill Game Details & Upload File
    Frontend->>API: POST /api/games/games/ (multipart/form-data)
    Note right of API: Auth Check: User must have 'developer' role
    alt Authorized
        API->>DB: Save Game (status='pending')
        DB-->>API: Saved
        API->>Frontend: 201 Created
        Frontend-->>Developer: Show "Submission Successful"
    else Unauthorized
        API-->>Frontend: 403 Forbidden
        Frontend-->>Developer: Show Error
    end
```

## 3. Game Approval (Admin)

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant API
    participant DB

    Admin->>Frontend: View Pending Games
    Frontend->>API: GET /api/games/games-list/?status=pending
    API->>DB: Query Pending Games
    DB-->>API: List of Games
    API-->>Frontend: Display List

    Admin->>Frontend: Click "Approve"
    Frontend->>API: PATCH /api/games/games/{id}/ (status='approved')
    Note right of API: Auth Check: User must have 'admin' role
    API->>DB: Update Status
    DB-->>API: Updated
    API-->>Frontend: 200 OK
    Frontend-->>Admin: Update UI (Game moved to Approved list)
```

## 4. Game Download (User)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant API
    participant DB

    User->>Frontend: Click "Download"
    Frontend->>API: GET /api/downloads/games/{id}/download/
    API->>DB: Check Game Status & User Permissions
    alt Allowed
        API->>DB: Create DownloadHistory Record
        API-->>Frontend: Stream File / Redirect to File
        Frontend-->>User: Download Starts
    else Not Allowed
        API-->>Frontend: 403 Forbidden
        Frontend-->>User: Show Error
    end
```
