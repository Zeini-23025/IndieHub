import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
// Prevent Library from navigating away during tests by stubbing useNavigate/useLocation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/library' }),
  };
});
import Library from '../pages/Library';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  libraryAPI: { getLibrary: vi.fn(), removeFromLibrary: vi.fn() },
  screenshotsAPI: { getScreenshots: vi.fn() },
  BACKEND_URL: 'http://127.0.0.1:8000',
}));

describe('Library Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders library entries and removes an entry', async () => {
    const mockEntries = [
      { id: 10, game: { id: 1, title: 'Cool Game', title_ar: 'لعبة' } },
    ];
    (api.libraryAPI.getLibrary as any).mockResolvedValue(mockEntries);
    (api.screenshotsAPI.getScreenshots as any).mockResolvedValue([{ id: 1, game: 1, image_path: '/media/s1.png', is_base: true }]);
    const mockRemove = vi.fn().mockResolvedValue({});
    (api.libraryAPI.removeFromLibrary as any) = mockRemove;

    // simulate logged in user
    localStorage.setItem('user', JSON.stringify({ id: 1, username: 'testuser' }));
    localStorage.setItem('token', 'mock-token');

    render(
      <MemoryRouter initialEntries={["/library"]}>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/library" element={<Library />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Cool Game/i)).toBeInTheDocument());

    const removeButton = screen.getByText(/Remove from Library/i);
    fireEvent.click(removeButton);

    // confirm button appears and click confirm
    const confirmButton = await screen.findByText(/CONFIRM/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
