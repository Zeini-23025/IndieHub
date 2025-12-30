# IndieHub - Game Launcher Platform

A web application that centralizes independent games and promotes developers from underrepresented communities. IndieHub provides a validation system to ensure cultural, ethical, and religious compliance while offering a modern interface for browsing, submitting, and downloading games.

## 🎮 Features

- **Game Submission**: Independent developers can submit their games for validation
- **Content Validation**: Admin system to verify games meet quality and cultural standards
- **Game Browser**: Users can search, filter, and download validated games
- **Developer Dashboard**: Track game submission status and manage uploaded games
- **User Accounts**: Personal library and download history for registered users
- **Library Management**: Users can manage their personal collection of games
- **Admin Panel**: Manage users, validate submissions, and oversee content
- **Bilingual Support**: Full support for English and Arabic interfaces and content (RTL/LTR)

## 📋 User Roles

- **Administrator**: Validate games, manage users, handle content compliance
- **Developer**: Submit games, track status, update submissions
- **User**: Browse and download games (with optional account features)

## 🛠️ Tech Stack

### Backend
- **Django** - REST API framework
- **Django REST Framework** - API development
- **Django CORS Headers** - Cross-origin resource sharing
- **SQLite** - Database (development)

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client

## 📦 Prerequisites

- Python 3.9+
- Node.js 16+
- npm or yarn

## 🚀 Installation & Setup

### Backend Setup
```bash

python -m venv venv
# mac/linux
source venv/bin/activate
# windows
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

```


```bash

cd backend

# Run migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend
- `python manage.py migrate` - Apply database migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py runserver` - Start development server
- `python manage.py test` - Run tests

## 📁 Project Structure

```
IndieHub/
├── backend/                  # Django REST API
│   ├── api/                 # Core API configuration
│   ├── games/               # Games management app
│   │   ├── models.py        # Game, Category, Screenshot models
│   │   ├── serializers.py   # DRF serializers
│   │   ├── views.py         # API views & viewsets
│   │   └── urls.py          # App-specific routes
│   ├── users/               # User management & Auth
│   │   ├── models.py        # Custom User model
│   │   ├── views.py         # Login/Register views
│   │   └── permissions.py   # Custom permissions (IsAdmin, IsDeveloper)
│   ├── library/             # User library (purchased/added games)
│   │   ├── models.py        # LibraryEntry model
│   │   ├── serializers.py   # LibraryEntrySerializer
│   │   ├── views.py         # LibraryEntryViewSet
│   │   └── urls.py          # Library routes
│   ├── downloads/           # Download tracking & history
│   ├── backend/             # Project settings (settings.py, etc.)
│   └── manage.py            # Django management script
├── frontend/                # React + TypeScript Client
│   ├── src/                 # Source code
│   │   ├── assets/          # Images & global styles
│   │   ├── App.tsx          # Main application component
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets (favicons, etc.)
│   ├── index.html           # HTML entry point
│   ├── package.json         # NPM dependencies
│   └── vite.config.ts       # Vite configuration
└── README.md
```

## 🔌 API Endpoints

Base URL: `http://localhost:8000/api/`

### Authentication & Users
- `POST /users/login/` - Authenticate & get token
- `POST /users/register/` - Register new user
- `GET /users/users/` - List users (Admin)

### Games Management
- `GET /games/games-list/` - List approved games (Public/Search)
- `GET /games/games-list/{id}/` - Retrieve game details
- `POST /games/games/` - Submit a new game (Developer)
- `PATCH /games/games/{id}/` - Update game or Approve/Reject (Admin)

### Categories
- `GET /games/categories-list/` - List all categories

### Library
- `GET /library/entries/` - List user's library entries
- `POST /library/entries/` - Add game to library
- `GET /library/entries/{id}/` - Retrieve library entry
- `DELETE /library/entries/{id}/` - Remove game from library

### Downloads
- `POST /downloads/downloads/` - Create a download history record (anonymous or authenticated)
- `GET /downloads/downloads/` - List download history records (Admin only)
- `GET /downloads/games/{game_id}/download/` - Protected game download (streams file; auth required)

### Screenshots
- `GET /games/screenshots/` - List screenshots (public)
- `GET /games/screenshots/{id}/` - Retrieve a screenshot
- `POST /games/screenshots/` - Upload a screenshot (game developer/owner or admin)
- `PATCH /games/screenshots/{id}/` - Update screenshot (owner or admin)
- `DELETE /games/screenshots/{id}/` - Delete screenshot (owner or admin)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of the IndieHub initiative to support independent developers.

## 🙏 Support

For issues or questions, please contact the development team or open an issue in the repository.
