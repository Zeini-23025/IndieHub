import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import * as api from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
    authAPI: {
        updateUser: vi.fn(),
        changePassword: vi.fn(),
    },
    BACKEND_URL: 'http://127.0.0.1:8000',
}));

// Mock window.location.reload
delete (window as any).location;
window.location = { reload: vi.fn() } as any;

const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'testuser@example.com',
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

describe('Profile Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock localStorage
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

    it('renders profile page with user information', () => {
        renderWithProviders(<Profile />);

        expect(screen.getByText('@testuser')).toBeInTheDocument();
        expect(screen.getByText('user')).toBeInTheDocument();
    });

    it('masks email address correctly', () => {
        renderWithProviders(<Profile />);

    // Email should be masked as test********r@example.com (mask keeps first 4 chars and last char)
    const maskedEmail = screen.getByText(/test\*+r@example\.com/);
        expect(maskedEmail).toBeInTheDocument();
    });

    it('displays profile image upload section', () => {
        renderWithProviders(<Profile />);

        expect(screen.getByText(/Update Profile Image/i)).toBeInTheDocument();
        expect(screen.getByText(/UPLOAD IMAGE/i)).toBeInTheDocument();
    });

    it('displays password change section', () => {
        renderWithProviders(<Profile />);

        const changeSection = screen.getByText(/Change Password/i).closest('div')!;
        expect(changeSection).toBeInTheDocument();
        // ensure there are three password inputs in the section
        const pwInputs = changeSection.querySelectorAll('input[type="password"]');
        expect(pwInputs.length).toBe(3);
    });

    it('shows remove image button when user has profile image', () => {
        renderWithProviders(<Profile />);

        expect(screen.getByText(/REMOVE IMAGE/i)).toBeInTheDocument();
    });

    it('validates password match before submission', async () => {
        renderWithProviders(<Profile />);


    const changeSection = screen.getByText(/Change Password/i).closest('div')!;
    const inputs = Array.from(changeSection.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
    const oldPasswordInput = inputs[0];
    const newPasswordInput = inputs[1];
    const confirmPasswordInput = inputs[2];
    const submitButton = within(changeSection).getByText(/UPDATE PASSWORD/i);

    fireEvent.change(oldPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpass' } });
    fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
        });
    });

    it('calls API when changing password with matching passwords', async () => {
        const mockChangePassword = vi.fn().mockResolvedValue({});
        (api.authAPI.changePassword as any) = mockChangePassword;

        renderWithProviders(<Profile />);


    const changeSection = screen.getByText(/Change Password/i).closest('div')!;
    const inputs = Array.from(changeSection.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
    const oldPasswordInput = inputs[0];
    const newPasswordInput = inputs[1];
    const confirmPasswordInput = inputs[2];
    const submitButton = within(changeSection).getByText(/UPDATE PASSWORD/i);

    fireEvent.change(oldPasswordInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockChangePassword).toHaveBeenCalledWith({
                old_password: 'oldpass123',
                new_password: 'newpass123',
                confirm_password: 'newpass123',
            });
        });
    });

    it('handles password change error', async () => {
        const mockChangePassword = vi.fn().mockRejectedValue({
            response: { data: { old_password: ['Wrong password.'] } },
        });
        (api.authAPI.changePassword as any) = mockChangePassword;

        renderWithProviders(<Profile />);


    const changeSection = screen.getByText(/Change Password/i).closest('div')!;
    const inputs = Array.from(changeSection.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
    const oldPasswordInput = inputs[0];
    const newPasswordInput = inputs[1];
    const confirmPasswordInput = inputs[2];
    const submitButton = within(changeSection).getByText(/UPDATE PASSWORD/i);

    fireEvent.change(oldPasswordInput, { target: { value: 'wrongpass' } });
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'newpass123' } });
    fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Wrong password/i)).toBeInTheDocument();
        });
    });

    it('enables upload button only when file is selected', () => {
        renderWithProviders(<Profile />);

    const updateSection = screen.getByText(/Update Profile Image/i).closest('div')!;
    const uploadButton = within(updateSection).getByText(/UPLOAD IMAGE/i);
    expect(uploadButton).toBeDisabled();

    const fileInput = updateSection.querySelector('input[type="file"]');
        if (fileInput) {
            const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
            fireEvent.change(fileInput, { target: { files: [file] } });

            expect(uploadButton).not.toBeDisabled();
        }
    });

    it('calls remove image API when remove button is clicked', async () => {
        const mockUpdateUser = vi.fn().mockResolvedValue({ ...mockUser, profile_image: '' });
        (api.authAPI.updateUser as any) = mockUpdateUser;

        renderWithProviders(<Profile />);

        const removeButton = screen.getByText(/REMOVE IMAGE/i);
        fireEvent.click(removeButton);

        await waitFor(() => {
            expect(mockUpdateUser).toHaveBeenCalledWith(mockUser.id, { profile_image: '' });
        });
    });
});
