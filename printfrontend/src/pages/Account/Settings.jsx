import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import userService from '../../services/userService';
import './Account.css';
import './Orders.css';

const Settings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="loading-spinner">Loading settings...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                <div className="account-header">
                    <div>
                        <h1>Account Settings</h1>
                        <p>Manage your account preferences and security</p>
                    </div>
                </div>

                <div className="account-content">
                    {error && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    {success && (
                        <div className="alert alert-success">{success}</div>
                    )}

                    <div className="form-section">
                        <h2>Account Information</h2>
                        <div className="info-item">
                            <label>Username</label>
                            <div className="info-value">{user?.username}</div>
                            <span className="field-note">Username cannot be changed</span>
                        </div>
                        <div className="info-item">
                            <label>Email</label>
                            <div className="info-value">{user?.email}</div>
                            <span className="field-note">Email cannot be changed</span>
                        </div>
                        <div className="info-item">
                            <label>Account Created</label>
                            <div className="info-value">
                                {user?.date_joined 
                                    ? new Date(user.date_joined).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })
                                    : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Account Actions</h2>
                        <div className="settings-actions">
                            <button onClick={() => navigate('/account/profile')} className="btn-secondary">
                                Edit Profile
                            </button>
                            <button onClick={() => navigate('/account/addresses')} className="btn-secondary">
                                Manage Addresses
                            </button>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Security</h2>
                        <div className="security-actions">
                            <div className="security-item">
                                <div>
                                    <h3>Password</h3>
                                    <p>Change your account password</p>
                                </div>
                                <button className="btn-secondary" onClick={() => setShowPasswordModal(true)}>
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-section danger-zone">
                        <h2>Danger Zone</h2>
                        <div className="danger-actions">
                            <div className="danger-item">
                                <div>
                                    <h3>Sign Out</h3>
                                    <p>Sign out from your account</p>
                                </div>
                                <button onClick={handleLogout} className="btn-danger">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="od-modal-overlay" onClick={closePasswordModal}>
                    <div className="od-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="od-modal-header">
                            <h2>Change Password</h2>
                            <button onClick={closePasswordModal} className="od-modal-close">&times;</button>
                        </div>
                        <form onSubmit={handlePasswordChange}>
                            <div className="od-modal-body">
                                {passwordError && (
                                    <div className="od-alert od-alert-error">
                                        <FaTimesCircle /> {passwordError}
                                    </div>
                                )}
                                {passwordSuccess && (
                                    <div className="od-alert od-alert-success">
                                        <FaCheckCircle /> {passwordSuccess}
                                    </div>
                                )}

                                <div className="od-form-group">
                                    <label>Current Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showOldPassword ? 'text' : 'password'}
                                            value={passwordForm.oldPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                        >
                                            {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="od-form-group">
                                    <label>New Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                            placeholder="Enter new password (min 8 characters)"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className="od-form-group">
                                    <label>Confirm New Password *</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordForm.newPasswordConfirm}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPasswordConfirm: e.target.value }))}
                                            placeholder="Re-enter new password"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                    {passwordForm.newPassword && passwordForm.newPasswordConfirm && (
                                        <span className={`field-note ${passwordForm.newPassword === passwordForm.newPasswordConfirm ? 'text-green' : 'text-red'}`}>
                                            {passwordForm.newPassword === passwordForm.newPasswordConfirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="od-modal-footer">
                                <button type="button" onClick={closePasswordModal} className="od-btn od-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={passwordLoading} className="od-btn od-btn-primary">
                                    {passwordLoading ? 'Changing...' : 'Change Password'}
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
