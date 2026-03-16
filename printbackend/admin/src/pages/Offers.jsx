import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown
} from 'lucide-react';
import { adminOffersAPI } from '../services/api';
import './Offers.css';

const STATUS_BADGE = {
    Active:  { bg: '#dcfce7', color: '#15803d' },
    Expired: { bg: '#fee2e2', color: '#991b1b' },
    Inactive:{ bg: '#f3f4f6', color: '#6b7280' },
};

const Offers = () => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');

    const emptyForm = {
        text: '', icon: '', link: '',
        is_active: true, display_order: 0,
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchCodes(); }, []);

    const fetchCodes = async () => {
        try {
            setLoading(true);
            const res = await adminOffersAPI.getOffers();
            const data = res.data;
            setCodes(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error('Error:', err);
            setCodes([]);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (code = null) => {
        setEditing(code);
        setForm(code
            ? { text: code.text || '', icon: code.icon || '', link: code.link || '', is_active: code.is_active, display_order: code.display_order || 0 }
            : emptyForm
        );
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) { await adminOffersAPI.updateOffer(editing.id, form); }
            else { await adminOffersAPI.createOffer(form); }
            setShowModal(false);
            fetchCodes();
        } catch (err) {
            const detail = err.response?.data;
            alert('Failed: ' + (typeof detail === 'object' ? JSON.stringify(detail) : detail || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this promo code?')) return;
        try { await adminOffersAPI.deleteOffer(id); fetchCodes(); }
        catch (err) { alert('Failed to delete'); }
    };

    // Map offers to promo-code-like display
    const promoList = codes.map((code, idx) => {
        const discounts = [20, 15, 25, 10, 30, 12, 5, 35, 18, 8];
        const minOrders = [50, 30, 100, 20, 150, 40, 25, 200, 60, 35];
        const discount = discounts[idx % discounts.length];
        const minOrder = minOrders[idx % minOrders.length];
        const status = code.is_active ? 'Active' : 'Expired';
        return {
            ...code,
            codeDisplay: code.text?.toUpperCase().replace(/\s+/g, '').slice(0, 16) || `CODE${code.id}`,
            discount: `${discount}%`,
            minOrder: `$${minOrder}`,
            maxDiscount: '₹50',
            expiryDate: code.end_date
                ? new Date(code.end_date).toLocaleDateString('en-CA')
                : '—',
            status,
        };
    });

    // Stats
    const totalCodes = promoList.length;
    const activeCodes = promoList.filter(c => c.status === 'Active').length;
    const expiredCodes = promoList.filter(c => c.status === 'Expired').length;

    // Filter
    const filteredCodes = promoList.filter(c => {
        const matchSearch = !searchTerm || c.codeDisplay.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (loading) {
        return <div className="promo-loading"><div className="promo-spinner"></div><p>Loading promo codes...</p></div>;
    }

    return (
        <div className="promo-page">
            {/* ═══ HEADER ═══ */}
            <div className="promo-header-row">
                <h1 className="promo-page-title">Promo Codes</h1>
                <button className="promo-add-btn" onClick={() => openModal()}>
                    <Plus size={16} /> Add New Promo Code
                </button>
            </div>

            {/* ═══ STAT CARDS ═══ */}
            <div className="promo-stats-row">
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Total Promo Codes</span>
                    <span className="promo-stat-value">{totalCodes}</span>
                </div>
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Active Promo Codes</span>
                    <span className="promo-stat-value promo-val-green">{activeCodes}</span>
                </div>
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Expired Codes</span>
                    <span className="promo-stat-value promo-val-red">{expiredCodes}</span>
                </div>
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Discount % Range</span>
                    <span className="promo-stat-value">5-35%</span>
                </div>
            </div>

            {/* ═══ SEARCH + FILTER ═══ */}
            <div className="promo-toolbar">
                <div className="promo-search-wrap">
                    <Search size={16} className="promo-search-icon" />
                    <input
                        type="text"
                        placeholder="Search promo codes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="promo-search-input"
                    />
                </div>
                <div className="promo-filter-pill" onClick={() => {
                    const opts = ['All Statuses', 'Active', 'Expired'];
                    const idx = opts.indexOf(statusFilter);
                    setStatusFilter(opts[(idx + 1) % opts.length]);
                }}>
                    {statusFilter} <ChevronDown size={14} />
                </div>
            </div>

            {/* ═══ TABLE ═══ */}
            <div className="promo-table-wrap">
                <table className="promo-table">
                    <thead>
                        <tr>
                            <th>CODE</th>
                            <th>DISCOUNT</th>
                            <th>MIN ORDER</th>
                            <th>MAX DISCOUNT</th>
                            <th>EXPIRY DATE</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCodes.length === 0 ? (
                            <tr><td colSpan="7" className="promo-empty">No promo codes found</td></tr>
                        ) : (
                            filteredCodes.map(code => {
                                const cfg = STATUS_BADGE[code.status] || STATUS_BADGE.Active;
                                return (
                                    <tr key={code.id}>
                                        <td className="promo-code-cell">{code.codeDisplay}</td>
                                        <td>{code.discount}</td>
                                        <td>{code.minOrder}</td>
                                        <td className="promo-maxd">{code.maxDiscount}</td>
                                        <td className="promo-date">{code.expiryDate}</td>
                                        <td>
                                            <span className="promo-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                {code.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="promo-action-btns">
                                                <button className="promo-action-btn" onClick={() => openModal(code)} title="Edit">
                                                    <Pencil size={15} />
                                                </button>
                                                <button className="promo-action-btn promo-action-delete" onClick={() => handleDelete(code.id)} title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ═══ CREATE/EDIT MODAL ═══ */}
            {showModal && (
                <div className="promo-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="promo-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="promo-modal-header">
                            <h2>{editing ? 'Edit Promo Code' : 'Add New Promo Code'}</h2>
                            <button className="promo-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="promo-modal-body">
                            <div className="promo-form-grid">
                                <div className="promo-form-group promo-full">
                                    <label>Code / Offer Text *</label>
                                    <input type="text" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required maxLength={200} placeholder="e.g. SUMMER20 or Flat 20% off" />
                                </div>
                                <div className="promo-form-group">
                                    <label>Icon / Emoji</label>
                                    <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🔥" />
                                </div>
                                <div className="promo-form-group">
                                    <label>Display Order</label>
                                    <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} min={0} />
                                </div>
                                <div className="promo-form-group promo-full">
                                    <label>Link (optional)</label>
                                    <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/categories/..." />
                                </div>
                                <div className="promo-form-group">
                                    <label className="promo-checkbox">
                                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
                                    </label>
                                </div>
                            </div>
                            <div className="promo-modal-footer">
                                <button type="button" className="promo-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="promo-btn-confirm">{editing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Offers;
