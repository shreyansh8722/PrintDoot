import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiOutlineCog6Tooth, HiOutlineUser, HiOutlineMapPin, HiOutlineLockClosed, HiOutlineArrowRightOnRectangle, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineCalendar, HiOutlineEnvelope, HiOutlineShieldCheck } from 'react-icons/hi2';
import userService from '../../services/userService';

const Settings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [user, setUser] = useState(null);

    // Change Password state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            setLoading(true);
            const userData = await userService.getProfile();
            setUser(userData);
        } catch (err) {
            console.error('Error loading user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        userService.logout();
        navigate('/login');
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
            setPasswordError('New passwords do not match.');
            return;
        }
        if (passwordForm.oldPassword === passwordForm.newPassword) {
            setPasswordError('New password must be different from current password.');
            return;
        }

        try {
            setPasswordLoading(true);
            await userService.changePassword(
                passwordForm.oldPassword,
                passwordForm.newPassword,
                passwordForm.newPasswordConfirm
            );
            setPasswordSuccess('Password changed successfully!');
            setPasswordForm({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });

            // Update stored credentials with new password
            const username = localStorage.getItem('username');
            if (username) {
                const newCredentials = btoa(`${username}:${passwordForm.newPassword}`);
                localStorage.setItem('authCredentials', newCredentials);
            }

            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
                setSuccess('Password updated successfully!');
                setTimeout(() => setSuccess(''), 3000);
            }, 1500);
        } catch (err) {
            const data = err.response?.data;
            if (data) {
                const msgs = Object.entries(data)
                    .map(([key, val]) => Array.isArray(val) ? val.join(', ') : val)
                    .join(' ');
                setPasswordError(msgs || 'Failed to change password.');
            } else {
                setPasswordError('Failed to change password. Please try again.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordForm({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
        setPasswordError('');
        setPasswordSuccess('');
    };

    // Skeleton loader
    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="max-w-3xl mx-auto px-4 py-10">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-56" />
                        <div className="h-4 bg-gray-100 rounded w-80" />
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-6 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-40" />
                                    <div className="h-4 bg-gray-100 rounded w-64" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 py-10">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#00DCE5]/10 flex items-center justify-center">
                            <HiOutlineCog6Tooth className="w-5 h-5 text-[#00DCE5]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1a2332]">Account Settings</h1>
                    </div>
                    <p className="text-gray-500 ml-[52px]">Manage your account preferences and security</p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm">
                        <HiOutlineXCircle className="w-5 h-5 shrink-0" />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 text-green-700 text-sm">
                        <HiOutlineCheckCircle className="w-5 h-5 shrink-0" />
                        {success}
                    </div>
                )}

                <div className="space-y-6">
                    {/* Account Information */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-[#1a2332] mb-5">Account Information</h2>
                        <div className="space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center mt-0.5 shrink-0">
                                    <HiOutlineUser className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Username</p>
                                    <p className="text-[#1a2332] font-medium">{user?.username}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Username cannot be changed</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center mt-0.5 shrink-0">
                                    <HiOutlineEnvelope className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                                    <p className="text-[#1a2332] font-medium">{user?.email}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center mt-0.5 shrink-0">
                                    <HiOutlineCalendar className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Account Created</p>
                                    <p className="text-[#1a2332] font-medium">
                                        {user?.date_joined 
                                            ? new Date(user.date_joined).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-[#1a2332] mb-5">Quick Actions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/account/profile')}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 hover:border-[#00DCE5] hover:bg-[#00DCE5]/5 transition-all duration-200 group text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center shrink-0 group-hover:bg-[#00DCE5]/20 transition-colors">
                                    <HiOutlineUser className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#1a2332]">Edit Profile</p>
                                    <p className="text-xs text-gray-400">Update your personal info</p>
                                </div>
                            </button>
                            <button
                                onClick={() => navigate('/account/addresses')}
                                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 hover:border-[#00DCE5] hover:bg-[#00DCE5]/5 transition-all duration-200 group text-left"
                            >
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center shrink-0 group-hover:bg-[#00DCE5]/20 transition-colors">
                                    <HiOutlineMapPin className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#1a2332]">Manage Addresses</p>
                                    <p className="text-xs text-gray-400">Edit shipping & billing</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-[#1a2332] mb-5">Security</h2>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center shrink-0">
                                    <HiOutlineShieldCheck className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#1a2332]">Password</p>
                                    <p className="text-xs text-gray-400">Change your account password</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="px-4 py-2 text-sm font-medium text-[#00DCE5] border border-[#00DCE5] rounded-lg hover:bg-[#00DCE5] hover:text-white transition-all duration-200"
                            >
                                Change
                            </button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white border border-red-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-red-600 mb-5">Danger Zone</h2>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                    <HiOutlineArrowRightOnRectangle className="w-4 h-4 text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#1a2332]">Sign Out</p>
                                    <p className="text-xs text-gray-400">Sign out from your account</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePasswordModal} />

                    {/* Modal */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#00DCE5]/10 flex items-center justify-center">
                                    <HiOutlineLockClosed className="w-4 h-4 text-[#00DCE5]" />
                                </div>
                                <h2 className="text-lg font-semibold text-[#1a2332]">Change Password</h2>
                            </div>
                            <button
                                onClick={closePasswordModal}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handlePasswordChange}>
                            <div className="px-6 py-5 space-y-4">
                                {/* Alerts */}
                                {passwordError && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm">
                                        <HiOutlineXCircle className="w-4 h-4 shrink-0" />
                                        <span>{passwordError}</span>
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 text-green-700 text-sm">
                                        <HiOutlineCheckCircle className="w-4 h-4 shrink-0" />
                                        <span>{passwordSuccess}</span>
                                    </div>
                                )}

                                {/* Current Password */}
                                <div>
                                    <label className="block text-sm font-medium text-[#1a2332] mb-1.5">
                                        Current Password <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showOldPassword ? 'text' : 'password'}
                                            value={passwordForm.oldPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                            placeholder="Enter current password"
                                            required
                                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00DCE5]/30 focus:border-[#00DCE5] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showOldPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-[#1a2332] mb-1.5">
                                        New Password <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="Min 8 characters"
                                            required
                                            minLength={8}
                                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00DCE5]/30 focus:border-[#00DCE5] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showNewPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.newPassword && passwordForm.newPassword.length < 8 && (
                                        <p className="mt-1 text-xs text-amber-500">Must be at least 8 characters</p>
                                    )}
                                </div>

                                {/* Confirm New Password */}
                                <div>
                                    <label className="block text-sm font-medium text-[#1a2332] mb-1.5">
                                        Confirm New Password <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordForm.newPasswordConfirm}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPasswordConfirm: e.target.value }))}
                                            placeholder="Re-enter new password"
                                            required
                                            minLength={8}
                                            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00DCE5]/30 focus:border-[#00DCE5] transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {passwordForm.newPassword && passwordForm.newPasswordConfirm && (
                                        <p className={`mt-1 text-xs flex items-center gap-1 ${passwordForm.newPassword === passwordForm.newPasswordConfirm ? 'text-green-600' : 'text-red-500'}`}>
                                            {passwordForm.newPassword === passwordForm.newPasswordConfirm
                                                ? <><HiOutlineCheckCircle className="w-3.5 h-3.5" /> Passwords match</>
                                                : <><HiOutlineXCircle className="w-3.5 h-3.5" /> Passwords do not match</>
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                                <button
                                    type="button"
                                    onClick={closePasswordModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="px-5 py-2 text-sm font-medium text-white bg-[#00DCE5] rounded-lg hover:bg-[#00C4CC] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {passwordLoading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Changing...
                                        </span>
                                    ) : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
