import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('logs in successfully and stores user/token', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com', role: 'user' };
    const mockResponse = { user: mockUser, token: 'new-token' };
    (api.authAPI.login as any).mockResolvedValue(mockResponse);

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <LanguageProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Login/i });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('new-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });
});
