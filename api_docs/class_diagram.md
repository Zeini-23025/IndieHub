# Class Diagram

This diagram represents the data models and their relationships within the IndieHub backend.

```mermaid
classDiagram
    class User {
        +String username
        +String email
        +String role [admin, developer, user]
        +Image profile_image
    }

    class Game {
        +String title
        +String title_ar
        +String description
        +String description_ar
        +File file_path
        +String status [pending, approved, rejected]
        +DateTime created_at
        +DateTime updated_at
        +String rejection_reason
    }

    class Category {
        +String name
        +String name_ar
        +String description
        +String description_ar
    }

    class Screenshot {
        +Image image_path
        +Boolean is_base
        +DateTime uploaded_at
    }

    class Review {
        +Integer rating
        +String comment
        +DateTime created_at
        +DateTime updated_at
    }

    class DownloadHistory {
        +DateTime timestamp
        +String device_info
        +String ip_address
    }

    class LibraryEntry {
        +DateTime added_at
    }

    %% Relationships
    User "1" --o "0..*" Game : develops
    User "1" --o "0..*" Review : writes
    User "1" --o "0..*" DownloadHistory : makes
    User "1" --o "0..*" LibraryEntry : owns

    Game "0..*" -- "0..*" Category : belongs_to
    Game "1" --o "0..*" Screenshot : has
    Game "1" --o "0..*" Review : receives
    Game "1" --o "0..*" DownloadHistory : is_downloaded
    Game "1" --o "0..*" LibraryEntry : is_in_library
```

## Description

- **User**: The central entity, with roles distinguishing between administrators, developers, and regular users.
- **Game**: The core content, submitted by developers and approved by admins. It has support for bilingual fields (English/Arabic).
- **Category**: Classifies games. A game can belong to multiple categories.
- **Screenshot**: Visual assets for games. One screenshot per game is marked as `is_base` (primary).
- **Review**: User-generated feedback and ratings for games.
- **DownloadHistory**: Tracks file downloads for analytics, linked to users (if logged in) or anonymous (via IP/Device).
- **LibraryEntry**: Represents a user's collection of games (e.g., purchased or saved games).
