import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import userService from '../../services/userService';

const INPUT_CLASS = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400';
const LABEL_CLASS = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        type: 'shipping', recipient_name: '', phone_number: '', street: '',
        apartment_suite: '', city: '', state: '', zip_code: '',
        country: 'India', company_name: '', is_default: false,
    };
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { loadAddresses(); }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const data = await userService.getAddresses();
            setAddresses(data);
        } catch { setError('Failed to load addresses'); }
        finally { setLoading(false); }
    };

    const handleNewAddress = () => {
        setEditingAddress(null);
        setFormData(emptyForm);
        setShowModal(true);
        setError('');
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setFormData({
            type: address.type,
            recipient_name: address.recipient_name,
            phone_number: address.phone_number,
            street: address.street,
            apartment_suite: address.apartment_suite || '',
            city: address.city,
            state: address.state || '',
            zip_code: address.zip_code,
            country: address.country,
            company_name: address.company_name || '',
            is_default: address.is_default,
        });
        setShowModal(true);
        setError('');
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingAddress) await userService.updateAddress(editingAddress.id, formData);
            else await userService.createAddress(formData);
            await loadAddresses();
            setShowModal(false);
            setEditingAddress(null);
        } catch (err) {
            const data = err.response?.data;
            let msg = 'Failed to save address';
            if (data) {
                if (typeof data === 'string') msg = data;
                else if (data.message) msg = data.message;
                else if (data.detail) msg = data.detail;
                else { const f = Object.keys(data)[0]; if (f && Array.isArray(data[f])) msg = data[f][0]; }
            }
            setError(msg);
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try { await userService.deleteAddress(id); await loadAddresses(); }
        catch (err) { setError(err.response?.data?.message || 'Failed to delete address'); }
    };

    const shippingAddresses = addresses.filter(a => a.type === 'shipping');
    const billingAddresses = addresses.filter(a => a.type === 'billing');

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-64 bg-gray-100 rounded skeleton-shimmer mb-8" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-gray-50 rounded-2xl skeleton-shimmer" />)}
                    </div>
                </div>
            </div>
        );
    }

    const renderAddressSection = (title, list) => (
        <div className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
            {list.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                    <p className="text-sm text-gray-400">No {title.toLowerCase()} found. Add one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {list.map(address => (
                        <AddressCard key={address.id} address={address} onEdit={() => handleEditAddress(address)} onDelete={() => handleDelete(address.id)} />
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <FiMapPin className="text-brand text-lg" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Addresses</h1>
                            <p className="text-sm text-gray-500">Manage your shipping and billing addresses</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewAddress}
                        className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors w-fit cursor-pointer"
                    >
                        <FaPlus className="text-xs" /> Add Address
                    </button>
                </div>

                {error && !showModal && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
                )}

                {renderAddressSection('Shipping Addresses', shippingAddresses)}
                {renderAddressSection('Billing Addresses', billingAddresses)}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <AddressModal
                    formData={formData}
                    editingAddress={editingAddress}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onClose={() => { setShowModal(false); setEditingAddress(null); }}
                    error={error}
                    saving={saving}
                />
            )}
        </div>
    );
};


/* ══════════════════════════════════════════════════
   ADDRESS CARD
   ══════════════════════════════════════════════════ */
const AddressCard = ({ address, onEdit, onDelete }) => (
    <div className={`relative rounded-2xl border p-5 transition-all hover:shadow-md ${address.is_default ? 'border-brand/30 bg-brand/[0.02]' : 'border-gray-100 bg-white'}`}>
        {address.is_default && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand/10 text-brand">
                <FaCheck className="text-[8px]" /> Default
            </span>
        )}
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{address.recipient_name}</h3>
        {address.company_name && <p className="text-xs text-gray-500 mb-1">{address.company_name}</p>}
        <p className="text-xs text-gray-600 leading-relaxed">
            {address.street}
            {address.apartment_suite && <>, {address.apartment_suite}</>}
            <br />
            {address.city}, {address.state} {address.zip_code}
            <br />
            {address.country}
        </p>
        <p className="text-xs text-gray-500 mt-2">📞 {address.phone_number}</p>
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
                <FaEdit className="text-[10px]" /> Edit
            </button>
            <button
                onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            >
                <FaTrash className="text-[10px]" /> Delete
            </button>
        </div>
    </div>
);


/* ══════════════════════════════════════════════════
   ADDRESS MODAL
   ══════════════════════════════════════════════════ */
const AddressModal = ({ formData, editingAddress, onChange, onSubmit, onClose, error, saving }) => {
    const [pincodeStatus, setPincodeStatus] = useState(null);
    const [pincodeError, setPincodeError] = useState('');

    const handlePincodeBlur = async () => {
        const pincode = formData.zip_code?.trim();
        if (!pincode || pincode.length < 4) { setPincodeStatus(null); setPincodeError(''); return; }
        try {
            setPincodeStatus('checking');
            setPincodeError('');
            const result = await userService.validatePincode(pincode);
            setPincodeStatus(result);
            if (result.serviceable) {
                const event = (name, value) => ({ target: { name, value, type: 'text' } });
                if (result.city) onChange(event('city', result.city));
                if (result.state) onChange(event('state', result.state));
                setPincodeError('');
            } else {
                setPincodeError('This pincode is not serviceable for delivery.');
            }
        } catch {
            setPincodeStatus(null);
            setPincodeError('Unable to validate pincode.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeInUp"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-lg">
                        ×
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
                    )}

                    <div>
                        <label className={LABEL_CLASS}>Address Type *</label>
                        <select name="type" value={formData.type} onChange={onChange} required className={INPUT_CLASS}>
                            <option value="shipping">Shipping</option>
                            <option value="billing">Billing</option>
                        </select>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Recipient Name *</label>
                        <input type="text" name="recipient_name" value={formData.recipient_name} onChange={onChange} required className={INPUT_CLASS} placeholder="Full name" />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Phone Number *</label>
                        <input type="tel" name="phone_number" value={formData.phone_number} onChange={onChange} required className={INPUT_CLASS} placeholder="+91 98765 43210" />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Street Address *</label>
                        <input type="text" name="street" value={formData.street} onChange={onChange} required className={INPUT_CLASS} placeholder="House no, street name" />
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Apartment, Suite, etc.</label>
                        <input type="text" name="apartment_suite" value={formData.apartment_suite} onChange={onChange} className={INPUT_CLASS} placeholder="Floor, unit, landmark" />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={LABEL_CLASS}>City *</label>
                            <input type="text" name="city" value={formData.city} onChange={onChange} required className={INPUT_CLASS} />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>State *</label>
                            <input type="text" name="state" value={formData.state} onChange={onChange} required className={INPUT_CLASS} />
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>PIN Code *</label>
                            <input type="text" name="zip_code" value={formData.zip_code} onChange={onChange} onBlur={handlePincodeBlur} required className={INPUT_CLASS} />
                            {pincodeStatus === 'checking' && <p className="text-[11px] text-gray-400 mt-1">Checking…</p>}
                            {pincodeStatus && pincodeStatus !== 'checking' && pincodeStatus.serviceable && (
                                <p className="text-[11px] text-emerald-600 mt-1">✓ Serviceable — {pincodeStatus.city}, {pincodeStatus.state}</p>
                            )}
                            {pincodeError && <p className="text-[11px] text-red-500 mt-1">{pincodeError}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Country *</label>
                        <select name="country" value={formData.country} onChange={onChange} required className={INPUT_CLASS}>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                        </select>
                    </div>

                    <div>
                        <label className={LABEL_CLASS}>Company Name</label>
                        <input type="text" name="company_name" value={formData.company_name} onChange={onChange} className={INPUT_CLASS} placeholder="Optional" />
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            name="is_default"
                            checked={formData.is_default}
                            onChange={onChange}
                            className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                        />
                        <span className="text-sm text-gray-700">Set as default {formData.type} address</span>
                    </label>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Addresses;
