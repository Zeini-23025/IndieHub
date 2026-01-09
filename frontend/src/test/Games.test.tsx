import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Games from '../pages/Games';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  gamesAPI: { getGames: vi.fn() },
  categoriesAPI: { getCategories: vi.fn() },
  screenshotsAPI: { getScreenshots: vi.fn() },
  BACKEND_URL: 'http://127.0.0.1:8000',
}));

describe('Games Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders approved games from API', async () => {
    const mockGames = [
      { id: 1, title: 'Cool Game', title_ar: 'لعبة', description: 'desc', description_ar: 'وصف', categories: [{ id: 1, name: 'Action', name_ar: 'أكشن' }], status: 'approved' },
    ];
    (api.gamesAPI.getGames as any).mockResolvedValue(mockGames);
    (api.categoriesAPI.getCategories as any).mockResolvedValue([]);
    (api.screenshotsAPI.getScreenshots as any).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/games"]}>
        <LanguageProvider>
          <Routes>
            <Route path="/games" element={<Games />} />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cool Game/i)).toBeInTheDocument();
    });
  });
});
