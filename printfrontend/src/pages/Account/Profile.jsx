import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaTrash } from 'react-icons/fa';
import { FiUser } from 'react-icons/fi';
import userService from '../../services/userService';

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

    useEffect(() => { loadProfile(); }, []);

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
        } catch {
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
        } catch {
            setError('Failed to remove avatar.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

    const initials = (formData.first_name?.[0] || formData.email?.[0] || '?').toUpperCase();

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="h-8 w-40 bg-gray-100 rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-56 bg-gray-100 rounded skeleton-shimmer mb-8" />
                    <div className="space-y-6">
                        <div className="h-20 bg-gray-50 rounded-2xl skeleton-shimmer" />
                        <div className="h-48 bg-gray-50 rounded-2xl skeleton-shimmer" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ── Header ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <FiUser className="text-brand text-lg" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
                            <p className="text-sm text-gray-500">Manage your personal information</p>
                        </div>
                    </div>
                </div>

                {/* ── Alerts ── */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                        {error.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">{success}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* ── Avatar section ── */}
                    <div className="rounded-2xl border border-gray-100 p-5 sm:p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">Profile Photo</h2>
                        <div className="flex items-center gap-5">
                            <div className="relative flex-shrink-0">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center text-brand text-2xl font-bold border-2 border-gray-100">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <FaCamera className="text-xs" /> {uploadingAvatar ? 'Uploading…' : 'Upload'}
                                    </button>
                                    {avatarUrl && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveAvatar}
                                            disabled={uploadingAvatar}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                                        >
                                            <FaTrash className="text-xs" /> Remove
                                        </button>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 mt-2">JPEG, PNG, WebP, GIF. Max 5 MB.</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Personal information ── */}
                    <div className="rounded-2xl border border-gray-100 p-5 sm:p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-5">Personal Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    placeholder="First name"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    placeholder="Last name"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* ── Business information ── */}
                    <div className="rounded-2xl border border-gray-100 p-5 sm:p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-1">Business Information</h2>
                        <p className="text-xs text-gray-400 mb-5">Optional — for invoicing</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleChange}
                                    placeholder="Your company name"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tax ID / GST Number</label>
                                <input
                                    type="text"
                                    name="tax_id"
                                    value={formData.tax_id}
                                    onChange={handleChange}
                                    placeholder="GST/Tax ID for invoices"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/account')}
                            className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
