import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';

const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user' as const,
    profile_image: '/media/profile_images/test.jpg',
};

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>{component}</AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    );
};

describe('Layout Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('When user is authenticated', () => {
        beforeEach(() => {
            const mockLocalStorage = {
                getItem: vi.fn((key) => {
                    if (key === 'user') return JSON.stringify(mockUser);
                    if (key === 'token') return 'mock-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
        });

        it('displays user avatar and username in sidebar', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('@testuser')).toBeInTheDocument();
            expect(screen.getByText('user')).toBeInTheDocument();
        });

        it('displays profile image with correct src', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            const avatar = screen.getByAltText('testuser');
            expect(avatar).toHaveAttribute('src', 'http://127.0.0.1:8000/media/profile_images/test.jpg');
        });

        it('shows authenticated navigation links', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('Home')).toBeInTheDocument();
            expect(screen.getByText('Games')).toBeInTheDocument();
            expect(screen.getByText('My Library')).toBeInTheDocument();
            expect(screen.getByText(/Profile/i)).toBeInTheDocument();
        });

        it('shows logout button', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('Logout')).toBeInTheDocument();
        });

        it('does not show login/register buttons', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.queryByText('Login')).not.toBeInTheDocument();
            expect(screen.queryByText('Register')).not.toBeInTheDocument();
        });
    });

    describe('When user is not authenticated', () => {
        beforeEach(() => {
            const mockLocalStorage = {
                getItem: vi.fn(() => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
        });

        it('does not display user avatar section', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.queryByText('@testuser')).not.toBeInTheDocument();
        });

        it('shows login and register buttons', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('Login')).toBeInTheDocument();
            expect(screen.getByText('Register')).toBeInTheDocument();
        });

        it('does not show profile link', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.queryByText(/Profile/i)).not.toBeInTheDocument();
        });

        it('does not show library link', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.queryByText('My Library')).not.toBeInTheDocument();
        });
    });

    describe('Language switcher', () => {
        it('displays language buttons', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('EN')).toBeInTheDocument();
            expect(screen.getByText('AR')).toBeInTheDocument();
        });

        it('switches language when button is clicked', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            const arButton = screen.getByText('AR');
            fireEvent.click(arButton);

            // Check if RTL is applied
            expect(document.documentElement.dir).toBe('rtl');
        });
    });

    describe('Default avatar', () => {
        beforeEach(() => {
            const userWithoutImage = { ...mockUser, profile_image: undefined };
            const mockLocalStorage = {
                getItem: vi.fn((key) => {
                    if (key === 'user') return JSON.stringify(userWithoutImage);
                    if (key === 'token') return 'mock-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
        });

        it('displays default avatar when user has no profile image', () => {
            renderWithProviders(<Layout><div>Content</div></Layout>);

            const avatar = screen.getByAltText('testuser');
            expect(avatar).toHaveAttribute('src', '/default-avatar.svg');
        });
    });

    describe('Role-based navigation', () => {
        it('shows dashboard link for developer users', () => {
            const developerUser = { ...mockUser, role: 'developer' as const };
            const mockLocalStorage = {
                getItem: vi.fn((key) => {
                    if (key === 'user') return JSON.stringify(developerUser);
                    if (key === 'token') return 'mock-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('Games Management')).toBeInTheDocument();
        });

        it('shows admin links for admin users', () => {
            const adminUser = { ...mockUser, role: 'admin' as const };
            const mockLocalStorage = {
                getItem: vi.fn((key) => {
                    if (key === 'user') return JSON.stringify(adminUser);
                    if (key === 'token') return 'mock-token';
                    return null;
                }),
                setItem: vi.fn(),
                removeItem: vi.fn(),
            };
            Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

            renderWithProviders(<Layout><div>Content</div></Layout>);

            expect(screen.getByText('Game Status')).toBeInTheDocument();
            expect(screen.getByText('Category Management')).toBeInTheDocument();
        });
    });
});
