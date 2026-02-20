import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import GameDetail from '../pages/GameDetail';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  gamesAPI: { getGame: vi.fn() },
  reviewsAPI: { getReviews: vi.fn(), createReview: vi.fn() },
  screenshotsAPI: { getScreenshots: vi.fn() },
  libraryAPI: { getLibrary: vi.fn(), addToLibrary: vi.fn(), removeFromLibrary: vi.fn() },
  downloadsAPI: { downloadGame: vi.fn() },
  BACKEND_URL: 'http://127.0.0.1:8000',
}));

describe('GameDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('adds game to library when authenticated', async () => {
    const mockGame = { id: 1, title: 'Cool Game', title_ar: 'لعبة', description: 'desc', description_ar: 'وصف', categories: [], status: 'approved' };
    (api.gamesAPI.getGame as any).mockResolvedValue(mockGame);
    (api.reviewsAPI.getReviews as any).mockResolvedValue([]);
    (api.screenshotsAPI.getScreenshots as any).mockResolvedValue([]);
    (api.libraryAPI.getLibrary as any).mockResolvedValue([]);
    const mockAdd = vi.fn().mockResolvedValue({});
    (api.libraryAPI.addToLibrary as any) = mockAdd;

    // simulate logged in user
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));
    localStorage.setItem('token', 'mock-token');

    render(
      <MemoryRouter initialEntries={["/games/1"]}>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/games/:id" element={<GameDetail />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Cool Game/i)).toBeInTheDocument());

    const addButton = screen.getByRole('button', { name: /add to library/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalled();
    });
  });

  it('displays user profile image in reviews', async () => {
    const mockGame = { id: 1, title: 'Cool Game', title_ar: 'لعبة', description: 'desc', description_ar: 'وصف', categories: [], status: 'approved' };
    const mockReviews = [
      {
        id: 1,
        user: 1,
        user_username: 'UserWithImage',
        user_profile_image: 'http://example.com/profile.jpg',
        rating: 5,
        comment: 'Great game!',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        user: 2,
        user_username: 'UserNoImage',
        rating: 4,
        comment: 'Good game.',
        created_at: new Date().toISOString()
      }
    ];

    (api.gamesAPI.getGame as any).mockResolvedValue(mockGame);
    (api.reviewsAPI.getReviews as any).mockResolvedValue(mockReviews);
    (api.screenshotsAPI.getScreenshots as any).mockResolvedValue([]);
    (api.libraryAPI.getLibrary as any).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/games/1"]}>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/games/:id" element={<GameDetail />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    // Check for profile image
    await waitFor(() => {
      const profileImage = screen.getByAltText('UserWithImage');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'http://example.com/profile.jpg');
    });

    // Check for initial fallback
    expect(screen.getByText('U')).toBeInTheDocument(); // First letter of UserNoImage
  });
});
