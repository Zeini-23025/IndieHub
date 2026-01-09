import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import RetroButton from '../components/RetroButton';
import RetroInput from '../components/RetroInput';
import { authAPI, BACKEND_URL } from '../services/api';

const Profile: React.FC = () => {
    const { user, setUser } = useAuth();
    const { t } = useLanguage();
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [passwords, setPasswords] = useState({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const getImageUrl = (path: string | undefined) => {
        if (!path) return 'https://via.placeholder.com/150';
        if (path.startsWith('http')) return path;
        return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const maskEmail = (email: string) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        if (name.length <= 4) return email;
        return `${name.substring(0, 4)}********${name.charAt(name.length - 1)}@${domain}`;
    };

    const handleImageUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileImage || !user) return;

        setMessage(null);
        const formData = new FormData();
        formData.append('profile_image', profileImage);

        try {
            const updatedUser = await authAPI.updateUser(user.id, formData);
            // Update local user state and localStorage
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMessage({ type: 'success', text: 'Profile image updated successfully!' });
            // Small delay to ensure localStorage is written before reload
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to update image' });
        }
    };

    const handleRemoveImage = async () => {
        if (!user) return;

        setMessage(null);

        try {
            const updatedUser = await authAPI.updateUser(user.id, { profile_image: '' });
            // Update local user state and localStorage
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMessage({ type: 'success', text: 'Profile image removed successfully!' });
            // Small delay to ensure localStorage is written before reload
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to remove image' });
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setMessage(null);
        try {
            await authAPI.changePassword(passwords);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswords({ old_password: '', new_password: '', confirm_password: '' });
        } catch (error: any) {
            const errorData = error.response?.data;
            const errorText = errorData?.old_password?.[0] || errorData?.detail || 'Failed to change password';
            setMessage({ type: 'error', text: errorText });
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="font-pixel-2xl text-accent-primary-bright mb-8 crt-glow text-center">
                {t('profile.title') || 'USER PROFILE'}
            </h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 bg-bg-secondary pixel-border p-6 flex flex-col items-center">
                    <div className="w-32 h-32 mb-4 relative">
                        <img
                            src={getImageUrl(user.profile_image)}
                            alt="Profile"
                            className="w-full h-full object-cover pixel-border-sm"
                        />
                    </div>
                    <h2 className="font-pixel text-accent-red-bright mb-2">@{user.username}</h2>
                    <p className="font-mono text-xs text-text-secondary mb-4">{maskEmail(user.email)}</p>
                    <div className="px-3 py-1 bg-accent-primary/10 border border-accent-primary/30 rounded text-accent-primary font-pixel text-[10px] uppercase">
                        {user.role}
                    </div>
                </div>

                {/* Management Tabs */}
                <div className="md:col-span-2 space-y-8">
                    {message && (
                        <div className={`p-4 font-mono text-sm border-2 ${message.type === 'success' ? 'bg-success/10 border-success text-success' : 'bg-error/10 border-error text-error'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Update Image Section */}
                    <div className="bg-bg-secondary pixel-border p-6">
                        <h3 className="font-pixel text-text-primary mb-4 uppercase">{t('profile.updateImage') || 'Update Profile Image'}</h3>
                        <form onSubmit={handleImageUpload} className="space-y-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                                className="w-full px-4 py-2 bg-bg-tertiary border-2 border-border-color font-mono text-xs focus:border-accent-primary outline-none"
                            />
                            <RetroButton type="submit" variant="primary" disabled={!profileImage}>
                                {t('common.upload') || 'UPLOAD IMAGE'}
                            </RetroButton>
                            {user.profile_image && (
                                <RetroButton type="button" variant="danger" onClick={handleRemoveImage}>
                                    {t('profile.removeImage') || 'REMOVE IMAGE'}
                                </RetroButton>
                            )}
                        </form>
                    </div>

                    {/* Change Password Section */}
                    <div className="bg-bg-secondary pixel-border p-6">
                        <h3 className="font-pixel text-text-primary mb-4 uppercase">{t('profile.changePassword') || 'Change Password'}</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <RetroInput
                                type="password"
                                label={t('profile.oldPassword') || 'Current Password'}
                                value={passwords.old_password}
                                onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                                required
                            />
                            <RetroInput
                                type="password"
                                label={t('profile.newPassword') || 'New Password'}
                                value={passwords.new_password}
                                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                required
                            />
                            <RetroInput
                                type="password"
                                label={t('profile.confirmPassword') || 'Confirm New Password'}
                                value={passwords.confirm_password}
                                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                required
                            />
                            <RetroButton type="submit" variant="secondary">
                                {t('profile.updatePassword') || 'UPDATE PASSWORD'}
                            </RetroButton>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
