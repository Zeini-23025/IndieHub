import axios from 'axios';

export const BACKEND_URL = 'http://127.0.0.1:8000';
const API_BASE_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'developer' | 'user';
}

export interface Category {
  id: number;
  name: string;
  description: string;
  name_ar: string;
  description_ar: string;
}

export interface Game {
  id: number;
  title: string;
  description: string;
  title_ar: string;
  description_ar: string;
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  developer: number;
  categories: Category[];
  created_at: string;
  updated_at: string;
  base_screenshot?: string;
  average_rating?: number;
  download_count?: number;
  rejection_reason?: string;
}

export interface HomeSections {
  most_popular: Game[];
  new_releases: Game[];
  top_rated: Game[];
  trending_now: Game[];
  hidden_gems: Game[];
}

export interface Screenshot {
  id: number;
  game: number;
  image_path: string;
  is_base: boolean;
  uploaded_at: string;
}

export interface Review {
  id: number;
  game: number;
  user: number;
  user_username: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryEntry {
  id: number;
  user: number;
  game: Game;
  added_at: string;
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/users/login/', { username, password });
    return response.data;
  },
  register: async (username: string, email: string, password: string, role: 'user' | 'developer' = 'user') => {
    const response = await api.post('/users/register/', { username, email, password, role });
    return response.data;
  },
  logout: async () => {
    await api.post('/users/logout/');
  },
  // Note: Current user is stored in localStorage after login
  // If needed, you can fetch user by ID using /users/users/{id}/
};

// Games API
export const gamesAPI = {
  getGames: async (params?: Record<string, any>): Promise<Game[]> => {
    const response = await api.get('/games/games-list/', { params });
    return response.data;
  },
  getHomeSections: async (): Promise<HomeSections> => {
    const response = await api.get('/games/home-sections/');
    return response.data;
  },
  getGame: async (id: number): Promise<Game> => {
    const response = await api.get(`/games/games-list/${id}/`);
    return response.data;
  },
  createGame: async (gameData: FormData): Promise<Game> => {
    const response = await api.post('/games/games/', gameData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  updateGame: async (id: number, gameData: Partial<Game> | FormData): Promise<Game> => {
    const headers = gameData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const response = await api.patch(`/games/games/${id}/`, gameData, { headers });
    return response.data;
  },
  deleteGame: async (id: number) => {
    await api.delete(`/games/games/${id}/`);
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/games/categories-list/');
    return response.data;
  },
  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const response = await api.post('/games/categories/', categoryData);
    return response.data;
  },
  updateCategory: async (id: number, categoryData: Partial<Category>): Promise<Category> => {
    const response = await api.patch(`/games/categories/${id}/`, categoryData);
    return response.data;
  },
  deleteCategory: async (id: number) => {
    await api.delete(`/games/categories/${id}/`);
  },
};

// Screenshots API
export const screenshotsAPI = {
  getScreenshots: async (gameId?: number): Promise<Screenshot[]> => {
    // Use public screenshots-list endpoint
    const response = await api.get('/games/screenshots-list/');
    const screenshots = response.data;
    return gameId ? screenshots.filter((s: Screenshot) => s.game === gameId) : screenshots;
  },
  uploadScreenshot: async (screenshotData: FormData): Promise<Screenshot> => {
    const response = await api.post('/games/screenshots/', screenshotData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  deleteScreenshot: async (id: number) => {
    await api.delete(`/games/screenshots/${id}/`);
  },
};

// Reviews API
export const reviewsAPI = {
  getReviews: async (gameId?: number): Promise<Review[]> => {
    const url = gameId ? `/games/reviews-list/?game=${gameId}` : '/games/reviews-list/';
    const response = await api.get(url);
    return response.data;
  },
  createReview: async (gameId: number, rating: number, comment: string): Promise<Review> => {
    const response = await api.post('/games/reviews/', { game: gameId, rating, comment });
    return response.data;
  },
  updateReview: async (id: number, rating: number, comment: string): Promise<Review> => {
    const response = await api.patch(`/games/reviews/${id}/`, { rating, comment });
    return response.data;
  },
  deleteReview: async (id: number) => {
    await api.delete(`/games/reviews/${id}/`);
  },
};

// Library API
export const libraryAPI = {
  getLibrary: async (): Promise<LibraryEntry[]> => {
    const response = await api.get('/library/entries/');
    return response.data;
  },
  addToLibrary: async (gameId: number): Promise<LibraryEntry> => {
    const response = await api.post('/library/entries/', { game: gameId });
    return response.data;
  },
  removeFromLibrary: async (id: number) => {
    await api.delete(`/library/entries/${id}/`);
  },
};

// Downloads API
export const downloadsAPI = {
  downloadGame: async (gameId: number) => {
    const response = await api.get(`/downloads/games/${gameId}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
  getPopularGames: async (): Promise<Game[]> => {
    const response = await api.get('/downloads/popular-games/');
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDownloads: async (params: Record<string, unknown>) => {
    const response = await api.get('/games/analytics/downloads/', { params });
    return response.data;
  },
  getAvgRatings: async (params: Record<string, unknown>) => {
    const response = await api.get('/games/analytics/ratings/average/', { params });
    return response.data;
  },
  getRatingDistribution: async (params: Record<string, unknown>) => {
    const response = await api.get('/games/analytics/ratings/distribution/', { params });
    return response.data;
  },
};

export default api;

