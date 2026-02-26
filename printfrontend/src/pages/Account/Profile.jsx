import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaTrash } from 'react-icons/fa';
import userService from '../../services/userService';
import './Account.css';

const Profile = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company_name: '',
        tax_id: ''
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const user = await userService.getProfile();
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                company_name: user.company_name || '',
                tax_id: user.tax_id || ''
            });
            setAvatarUrl(user.avatar || null);
        } catch (err) {
            console.error('Error loading profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadingAvatar(true);
            setError('');
            const result = await userService.uploadAvatar(file);
            setAvatarUrl(result.avatar);
            setSuccess('Avatar updated!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const detail = err.response?.data;
            setError(detail?.avatar?.[0] || detail?.detail || 'Failed to upload avatar.');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setUploadingAvatar(true);
            await userService.removeAvatar();
            setAvatarUrl(null);
            setSuccess('Avatar removed.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to remove avatar.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await userService.updateProfile(formData);
            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            const errorData = err.response?.data;
            if (typeof errorData === 'object') {
                const errorMessages = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
                setError(errorMessages);
            } else {
                setError(errorData?.detail || errorData?.message || 'Failed to update profile');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="account-page">
                <div className="account-container">
                    <div className="loading-spinner">Loading profile...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="account-page">
            <div className="account-container">
                <div className="account-header">
                    <h1>My Profile</h1>
                    <p>Manage your personal information</p>
                </div>

                <div className="account-content">
                    <form onSubmit={handleSubmit} className="profile-form">
                        {error && (
                            <div className="alert alert-error">
                                {error.split('\n').map((line, idx) => (
                                    <div key={idx}>{line}</div>
                                ))}
                            </div>
                        )}

                        {success && (
                            <div className="alert alert-success">
                                {success}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <div className="form-section">
                            <h2>Profile Photo</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar"
                                            style={{
                                                width: '80px', height: '80px', borderRadius: '50%',
                                                objectFit: 'cover', border: '3px solid #e5e7eb',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '80px', height: '80px', borderRadius: '50%',
                                            background: '#f3f4f6', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '28px', color: '#9ca3af',
                                            border: '3px solid #e5e7eb', fontWeight: 'bold',
                                        }}>
                                            {(formData.first_name?.[0] || formData.email?.[0] || '?').toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleAvatarUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingAvatar}
                                            className="btn-secondary"
                                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <FaCamera /> {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                                        </button>
                                        {avatarUrl && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveAvatar}
                                                disabled={uploadingAvatar}
                                                className="btn-secondary"
                                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                            >
                                                <FaTrash /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.4rem' }}>
                                        JPEG, PNG, WebP, GIF. Max 5 MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Personal Information</h2>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        placeholder="First name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled
                                    className="disabled-input"
                                />
                                <span className="field-note">Email cannot be changed</span>
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Business Information (Optional)</h2>
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    placeholder="Your company name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tax ID / GST Number</label>
                                <input
                                    type="text"
                                    name="tax_id"
                                    value={formData.tax_id}
                                    onChange={handleChange}
                                    placeholder="GST/Tax ID for invoices"
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => navigate('/account')}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
