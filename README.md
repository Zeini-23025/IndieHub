# IndieHub - Game Launcher Platform

A web application that centralizes independent games and promotes developers from underrepresented communities. IndieHub provides a validation system to ensure cultural, ethical, and religious compliance while offering a modern interface for browsing, submitting, and downloading games.

## 🎮 Features

- **Game Submission**: Independent developers can submit their games for validation
- **Content Validation**: Admin system to verify games meet quality and cultural standards
- **Game Browser**: Users can search, filter, and download validated games
- **Developer Dashboard**: Track game submission status and manage uploaded games
- **User Accounts**: Personal library and download history for registered users
- **Admin Panel**: Manage users, validate submissions, and oversee content

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
├── backend/              # Django REST API
│   ├── api/             # Main API app
│   ├── backend/         # Project settings
│   └── manage.py
├── frontend/            # React + TypeScript
│   ├── src/            # Source code
│   ├── public/         # Static assets
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

The API documentation will be available at `http://localhost:8000/api/` once the backend is running.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is part of the IndieHub initiative to support independent developers.

## 🙏 Support

For issues or questions, please contact the development team or open an issue in the repository.
