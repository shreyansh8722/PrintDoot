import React, { useState, useEffect } from 'react';
import { adminOffersAPI } from '../services/api';
import './Offers.css';

const EMOJI_OPTIONS = ['🔥', '🚚', '☕', '🎉', '✨', '🎨', '💰', '⚡', '🎁', '🏷️', '💎', '🛒', '❤️', '👕', '📦'];

const Offers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        text: '',
        icon: '🔥',
        link: '',
        is_active: true,
        display_order: 0,
    });

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const res = await adminOffersAPI.getOffers();
            setOffers(res.data.results || res.data);
        } catch (err) {
            console.error('Error fetching offers:', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (offer = null) => {
        setEditing(offer);
        setForm(
            offer
                ? {
                    text: offer.text,
                    icon: offer.icon,
                    link: offer.link || '',
                    is_active: offer.is_active,
                    display_order: offer.display_order,
                }
                : { text: '', icon: '🔥', link: '', is_active: true, display_order: 0 }
        );
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await adminOffersAPI.updateOffer(editing.id, form);
                alert('Offer updated successfully');
            } else {
                await adminOffersAPI.createOffer(form);
                alert('Offer created successfully');
            }
            setShowModal(false);
            fetchOffers();
        } catch (err) {
            console.error('Error saving offer:', err);
            alert('Failed to save offer');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;
        try {
            await adminOffersAPI.deleteOffer(id);
            fetchOffers();
        } catch (err) {
            console.error('Error deleting offer:', err);
            alert('Failed to delete offer');
        }
    };

    const toggleActive = async (offer) => {
        try {
            await adminOffersAPI.updateOffer(offer.id, { is_active: !offer.is_active });
            fetchOffers();
        } catch (err) {
            console.error('Error toggling offer:', err);
        }
    };

    if (loading) return <div className="offers-page"><div className="loading-state">Loading offers…</div></div>;

    return (
        <div className="offers-page">
            <div className="page-header">
                <h1>🏷️ Marquee Offers</h1>
                <button className="btn-add-offer" onClick={() => openModal()}>
                    + Add Offer
                </button>
            </div>

            {offers.length === 0 ? (
                <div className="empty-state">
                    <p>No offers yet</p>
                    <span>Click "Add Offer" to create your first marquee offer.</span>
                </div>
            ) : (
                <div className="offers-table-wrapper">
                    <table className="offers-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Icon</th>
                                <th>Offer Text</th>
                                <th>Link</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map((offer) => (
                                <tr key={offer.id}>
                                    <td><span className="order-badge">{offer.display_order}</span></td>
                                    <td><span className="offer-icon">{offer.icon}</span></td>
                                    <td><span className="offer-text">{offer.text}</span></td>
                                    <td>
                                        {offer.link ? (
                                            <a href={offer.link} className="offer-link" target="_blank" rel="noopener noreferrer">
                                                {offer.link}
                                            </a>
                                        ) : (
                                            <span style={{ color: '#9ca3af' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            className={`status-badge ${offer.is_active ? 'active' : 'inactive'}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => toggleActive(offer)}
                                            title="Click to toggle"
                                        >
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="btn-edit" onClick={() => openModal(offer)}>Edit</button>
                                            <button className="btn-delete" onClick={() => handleDelete(offer.id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>{editing ? 'Edit Offer' : 'Add New Offer'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Offer Text *</label>
                                <input
                                    type="text"
                                    value={form.text}
                                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                                    placeholder="e.g. Flat 20% Off on All T-Shirts"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Icon Emoji</label>
                                    <select
                                        value={form.icon}
                                        onChange={(e) => setForm({ ...form, icon: e.target.value })}
                                    >
                                        {EMOJI_OPTIONS.map((emoji) => (
                                            <option key={emoji} value={emoji}>{emoji}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        value={form.display_order}
                                        onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Link (optional)</label>
                                <input
                                    type="text"
                                    value={form.link}
                                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                                    placeholder="e.g. /categories/t-shirts or https://..."
                                />
                            </div>

                            <div className="form-group">
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    />
                                    <label htmlFor="is_active">Active (visible on homepage)</label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    {editing ? 'Update Offer' : 'Create Offer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Offers;
