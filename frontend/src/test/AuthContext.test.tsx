import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
    authAPI: {
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
    },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
);

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('initializes with no user when localStorage is empty', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('initializes with user from localStorage', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user' as const,
        };
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('token', 'mock-token');

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('mock-token');
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('logs in user successfully', async () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user' as const,
        };
        const mockResponse = {
            user: mockUser,
            token: 'new-token',
        };
        (api.authAPI.login as any).mockResolvedValue(mockResponse);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.login('testuser', 'password123');
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.token).toBe('new-token');
        expect(result.current.isAuthenticated).toBe(true);
        expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
        expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('registers and logs in user', async () => {
        const mockUser = {
            id: 1,
            username: 'newuser',
            email: 'new@example.com',
            role: 'user' as const,
        };
        const mockLoginResponse = {
            user: mockUser,
            token: 'new-token',
        };
        (api.authAPI.register as any).mockResolvedValue({});
        (api.authAPI.login as any).mockResolvedValue(mockLoginResponse);

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.register('newuser', 'new@example.com', 'password123');
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('logs out user successfully', async () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
            role: 'user' as const,
        };
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('token', 'mock-token');

        const { result } = renderHook(() => useAuth(), { wrapper });

        await act(async () => {
            await result.current.logout();
        });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('updates user with setUser', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });

        const newUser = {
            id: 1,
            username: 'updateduser',
            email: 'updated@example.com',
            role: 'user' as const,
            profile_image: '/media/new-image.jpg',
        };

        act(() => {
            result.current.setUser(newUser);
        });

        expect(result.current.user).toEqual(newUser);
    });

    it('handles corrupted localStorage data', () => {
        localStorage.setItem('user', 'invalid-json');
        localStorage.setItem('token', 'mock-token');

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
    });
});
