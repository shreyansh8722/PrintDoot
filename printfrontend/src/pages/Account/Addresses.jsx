import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import userService from '../../services/userService';
import './Account.css';

const Addresses = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        type: 'shipping',
        recipient_name: '',
        phone_number: '',
        street: '',
        apartment_suite: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'India',
        company_name: '',
        is_default: false
    });

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const data = await userService.getAddresses();
            setAddresses(data);
        } catch (err) {
            console.error('Error loading addresses:', err);
            setError('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleNewAddress = () => {
        setEditingAddress(null);
        setFormData({
            type: 'shipping',
            recipient_name: '',
            phone_number: '',
            street: '',
            apartment_suite: '',
            city: '',
            state: '',
            zip_code: '',
            country: 'India',
            company_name: '',
            is_default: false
        });
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
            is_default: address.is_default
        });
        setShowModal(true);
        setError('');
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (editingAddress) {
                await userService.updateAddress(editingAddress.id, formData);
            } else {
                await userService.createAddress(formData);
            }
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
                else {
                    const firstField = Object.keys(data)[0];
                    if (firstField && Array.isArray(data[firstField])) {
                        msg = data[firstField][0];
                    }
                }
            }
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) {
            return;
        }

        try {
            await userService.deleteAddress(id);
            await loadAddresses();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete address');
        }
    };

    const shippingAddresses = addresses.filter(addr => addr.type === 'shipping');
    const billingAddresses = addresses.filter(addr => addr.type === 'billing');

    return (
        <div className="account-page">
            <div className="account-container">
                <div className="account-header">
                    <div className="header-content">
                        <h1>My Addresses</h1>
                        <p>Manage your shipping and billing addresses</p>
                    </div>
                    <button onClick={handleNewAddress} className="btn-primary">
                        <FaPlus /> Add New Address
                    </button>
                </div>

                <div className="account-content">
                    {error && !showModal && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    <div className="addresses-sections">
                        <div className="address-section">
                            <h2>Shipping Addresses</h2>
                            {loading ? (
                                <div className="loading-spinner">Loading addresses...</div>
                            ) : shippingAddresses.length === 0 ? (
                                <div className="empty-state">
                                    <p>No shipping addresses found. Add one to get started.</p>
                                </div>
                            ) : (
                                <div className="addresses-grid">
                                    {shippingAddresses.map(address => (
                                        <AddressCard
                                            key={address.id}
                                            address={address}
                                            onEdit={() => handleEditAddress(address)}
                                            onDelete={() => handleDelete(address.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="address-section">
                            <h2>Billing Addresses</h2>
                            {loading ? (
                                <div className="loading-spinner">Loading addresses...</div>
                            ) : billingAddresses.length === 0 ? (
                                <div className="empty-state">
                                    <p>No billing addresses found. Add one to get started.</p>
                                </div>
                            ) : (
                                <div className="addresses-grid">
                                    {billingAddresses.map(address => (
                                        <AddressCard
                                            key={address.id}
                                            address={address}
                                            onEdit={() => handleEditAddress(address)}
                                            onDelete={() => handleDelete(address.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Address Modal */}
            {showModal && (
                <AddressModal
                    formData={formData}
                    editingAddress={editingAddress}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onClose={() => {
                        setShowModal(false);
                        setEditingAddress(null);
                    }}
                    error={error}
                    saving={saving}
                />
            )}
        </div>
    );
};

const AddressCard = ({ address, onEdit, onDelete }) => {
    return (
        <div className={`address-card ${address.is_default ? 'default' : ''}`}>
            {address.is_default && (
                <div className="default-badge">
                    <FaCheck /> Default
                </div>
            )}
            <div className="address-card-body">
                <h3>{address.recipient_name}</h3>
                {address.company_name && <p className="company">{address.company_name}</p>}
                <p>{address.street}</p>
                {address.apartment_suite && <p>{address.apartment_suite}</p>}
                <p>{address.city}, {address.state} {address.zip_code}</p>
                <p>{address.country}</p>
                <p className="phone">📞 {address.phone_number}</p>
            </div>
            <div className="address-card-actions">
                <button onClick={onEdit} className="btn-icon" title="Edit">
                    <FaEdit />
                </button>
                <button onClick={onDelete} className="btn-icon btn-danger" title="Delete">
                    <FaTrash />
                </button>
            </div>
        </div>
    );
};

const AddressModal = ({ formData, editingAddress, onChange, onSubmit, onClose, error, saving }) => {
    const [pincodeStatus, setPincodeStatus] = useState(null); // null | 'checking' | { serviceable: true/false, city, state }
    const [pincodeError, setPincodeError] = useState('');

    const handlePincodeBlur = async () => {
        const pincode = formData.zip_code?.trim();
        if (!pincode || pincode.length < 4) {
            setPincodeStatus(null);
            setPincodeError('');
            return;
        }
        try {
            setPincodeStatus('checking');
            setPincodeError('');
            const result = await userService.validatePincode(pincode);
            setPincodeStatus(result);
            if (result.serviceable) {
                // Auto-fill city & state from pincode data
                const event = (name, value) => ({
                    target: { name, value, type: 'text' },
                });
                if (result.city) onChange(event('city', result.city));
                if (result.state) onChange(event('state', result.state));
                setPincodeError('');
            } else {
                setPincodeError('This pincode is not serviceable for delivery.');
            }
        } catch (err) {
            setPincodeStatus(null);
            setPincodeError('Unable to validate pincode.');
        }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{editingAddress ? 'Edit Address' : 'Add New Address'}</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <form onSubmit={onSubmit} className="modal-form">
                    {error && (
                        <div className="alert alert-error">{error}</div>
                    )}

                    <div className="form-group">
                        <label>Address Type *</label>
                        <select name="type" value={formData.type} onChange={onChange} required>
                            <option value="shipping">Shipping</option>
                            <option value="billing">Billing</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Recipient Name *</label>
                        <input
                            type="text"
                            name="recipient_name"
                            value={formData.recipient_name}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Street Address *</label>
                        <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={onChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Apartment, Suite, etc.</label>
                        <input
                            type="text"
                            name="apartment_suite"
                            value={formData.apartment_suite}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>State *</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>ZIP Code *</label>
                            <input
                                type="text"
                                name="zip_code"
                                value={formData.zip_code}
                                onChange={onChange}
                                onBlur={handlePincodeBlur}
                                required
                            />
                            {pincodeStatus === 'checking' && (
                                <span className="field-note" style={{ color: '#6b7280' }}>Checking pincode…</span>
                            )}
                            {pincodeStatus && pincodeStatus !== 'checking' && pincodeStatus.serviceable && (
                                <span className="field-note" style={{ color: '#16a34a' }}>
                                    ✓ Serviceable — {pincodeStatus.city}, {pincodeStatus.state}
                                    {pincodeStatus.cod_available && ' (COD available)'}
                                </span>
                            )}
                            {pincodeError && (
                                <span className="field-note" style={{ color: '#ef4444' }}>{pincodeError}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Country *</label>
                        <select name="country" value={formData.country} onChange={onChange} required>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Company Name</label>
                        <input
                            type="text"
                            name="company_name"
                            value={formData.company_name}
                            onChange={onChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="is_default"
                                checked={formData.is_default}
                                onChange={onChange}
                            />
                            <span>Set as default {formData.type} address</span>
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : editingAddress ? 'Update Address' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Addresses;
