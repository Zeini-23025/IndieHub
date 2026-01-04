# IndieHub - Game Launcher Platform

A web application that centralizes independent games and promotes developers from underrepresented communities. IndieHub provides a validation system to ensure cultural, ethical, and religious compliance while offering a modern interface for browsing, submitting, and downloading games.

---

## 🎮 Features

- **Game Submission**: Independent developers can submit their games for validation
- **Content Validation**: Admin system to verify games meet quality and cultural standards
- **Game Browser**: Users can search, filter, and download validated games
- **Most Popular Games**: Automatically tracks downloads to showcase trending games
- **Developer Dashboard**: Track game submission status and manage uploaded games
- **User Accounts**: Personal library and download history for registered users
- **Library Management**: Users can manage their personal collection of games
- **bilingual Support**: Full support for English and Arabic interfaces and content (RTL/LTR)
- **Reviews**: Community-driven rating and review system

## 📋 User Roles

- **Administrator**: Validate games, manage users, handle content compliance
- **Developer**: Submit games, track status, update submissions
- **User**: Browse, review, and download games (with optional account features)

---

## 🛠️ Tech Stack

### Backend
- **Django** - High-level Python Web Framework
- **Django REST Framework** - Toolkit for building Web APIs
- **Django CORS Headers** - Cross-origin resource sharing management
- **SQLite** - Lightweight database for development

### Frontend
- **React** - Library for building user interfaces
- **TypeScript** - Strongly typed JavaScript
- **Vite** - Next Generation Frontend Tooling
- **Axios** - Promise based HTTP client

---

## 📦 Prerequisites

- **Python**: 3.9+
- **Node.js**: 16+
- **npm** or **yarn**

---

## 🚀 Installation & Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/tvOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

---

##  Run with Docker

You can run the whole project (backend + frontend) using Docker and the included Compose file. From the repository root:

```bash
# Build images and start services (foreground, shows logs)
docker compose up --build

# Or run in background (detached)
docker compose up --build -d

# View logs for all services
docker compose logs -f

# Rebuild only one service (e.g. frontend) and restart it
docker compose build --no-cache frontend
docker compose up -d frontend
```

Ports used by the Compose setup:
- Frontend: http://localhost:80
- Backend (API): http://localhost:8000

Notes & troubleshooting
- If you see large build contexts or tar errors, ensure `.dockerignore` excludes `backend/media` and large files (the repo includes a `.dockerignore`).
- If your frontend shows CORS errors, prefer using relative API paths (e.g. Axios baseURL `/api`) or proxy `/api` via nginx. The development settings enable CORS when `DEBUG=True`.
- To run management commands inside the backend container:

```bash
# open a shell in the running backend container
docker compose exec backend sh

# run migrations or populate DB
docker compose exec backend python manage.py migrate --noinput
docker compose exec backend python manage.py populate_db
```

If you prefer local development without Docker, follow the steps in the "Installation & Setup" section above.


##�📁 Project Structure

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
│   ├── library/             # User library (purchased/added games)
│   ├── downloads/           # Download tracking & history
│   ├── backend/             # Project settings (settings.py, etc.)
│   └── manage.py            # Django management script
├── frontend/                # React + TypeScript Client
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API service calls
│   │   └── contexts/        # React contexts (Language, Auth)
│   ├── public/              # Static assets
│   └── vite.config.ts       # Vite configuration
├── api_docs/                # Detailed API Documentation
└── README.md
```

---

## 🔌 API Endpoints

**Base URL**: `http://localhost:8000/api/`

### Authentication & Users
- `POST /users/login/` - Authenticate & get token
- `POST /users/register/` - Register new user
- `GET /users/users/` - List users (Admin)

### Games Management
- `GET /games/games-list/` - List approved games (Public/Search)
- `GET /games/games-list/{id}/` - Retrieve game details
- `POST /games/games/` - Submit a new game (Developer)
- `PATCH /games/games/{id}/` - Update game or Approve/Reject (Admin)

### Downloads & Popularity
- `GET /downloads/popular-games/` - Get list of most locally popular games
- `GET /downloads/games/{game_id}/download/` - Download game file (Authenticated)
- `POST /downloads/downloads/` - Log a download manually (Backend utility)

### Reviews
- `GET /games/reviews-list/` - List all reviews
- `POST /games/reviews/` - Add a review
- `PATCH /games/reviews/{id}/` - Update your review

*For detailed API documentation, please refer to the `api_docs/` directory.*

---

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checkout

### Backend
- `python manage.py migrate` - Apply database migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py runserver` - Start development server
- `python manage.py test` - Run tests

---

## 🤝 Contributing

1. **Fork** the repository
2. **Clone** your fork (`git clone ...`)
3. Create a **Feature Branch** (`git checkout -b feature/MyFeature`)
4. **Commit** your changes (`git commit -m 'Add some feature'`)
5. **Push** to the branch (`git push origin feature/MyFeature`)
6. Open a **Pull Request**

---

## 📄 License

This project is part of the IndieHub initiative to support independent developers. All rights reserved.

---

## 🙏 Support

For issues or questions, please contact the development team or open an issue in the repository.
