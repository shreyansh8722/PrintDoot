import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Pencil, Trash2, X, ChevronDown, Tag, Percent, Calendar
} from 'lucide-react';
import { adminPromoCodeAPI } from '../services/api';
import FilterDropdown from '../components/FilterDropdown';
import './Offers.css';

const STATUS_BADGE = {
    Active:        { bg: '#dcfce7', color: '#15803d' },
    Expired:       { bg: '#fee2e2', color: '#991b1b' },
    Inactive:      { bg: '#f3f4f6', color: '#6b7280' },
    Scheduled:     { bg: '#dbeafe', color: '#1e40af' },
    'Limit Reached': { bg: '#fef3c7', color: '#92400e' },
};

const Offers = () => {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, total_used: 0 });

    const emptyForm = {
        code: '', description: '', discount_type: 'percentage',
        discount_value: '', min_order_amount: '0', max_discount: '',
        usage_limit: 0, valid_from: '', valid_to: '', is_active: true,
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [codesRes, statsRes] = await Promise.allSettled([
                adminPromoCodeAPI.getPromoCodes(),
                adminPromoCodeAPI.getStats(),
            ]);
            if (codesRes.status === 'fulfilled') {
                const data = codesRes.value.data;
                setCodes(Array.isArray(data) ? data : (data.results || []));
            }
            if (statsRes.status === 'fulfilled') {
                setStats(statsRes.value.data);
            }
        } catch (err) {
            console.error('Error:', err);
            setCodes([]);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (code = null) => {
        setEditing(code);
        if (code) {
            setForm({
                code: code.code || '',
                description: code.description || '',
                discount_type: code.discount_type || 'percentage',
                discount_value: code.discount_value || '',
                min_order_amount: code.min_order_amount || '0',
                max_discount: code.max_discount || '',
                usage_limit: code.usage_limit || 0,
                valid_from: code.valid_from ? code.valid_from.slice(0, 16) : '',
                valid_to: code.valid_to ? code.valid_to.slice(0, 16) : '',
                is_active: code.is_active ?? true,
            });
        } else {
            setForm(emptyForm);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                code: form.code.toUpperCase().trim(),
                description: form.description || '',
                discount_type: form.discount_type,
                discount_value: parseFloat(form.discount_value) || 0,
                min_order_amount: parseFloat(form.min_order_amount) || 0,
                usage_limit: parseInt(form.usage_limit, 10) || 0,
                is_active: form.is_active,
            };
            // Only include optional fields if they have values
            if (form.max_discount) submitData.max_discount = parseFloat(form.max_discount);
            if (form.valid_from) submitData.valid_from = new Date(form.valid_from).toISOString();
            if (form.valid_to) submitData.valid_to = new Date(form.valid_to).toISOString();

            if (editing) {
                await adminPromoCodeAPI.updatePromoCode(editing.id, submitData);
            } else {
                await adminPromoCodeAPI.createPromoCode(submitData);
            }
            setShowModal(false);
            fetchAll();
            alert(editing ? 'Promo code updated!' : 'Promo code created!');
        } catch (err) {
            const detail = err.response?.data;
            if (detail && typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                alert('Failed to save promo code:\n' + msgs.join('\n'));
            } else {
                alert('Network error: ' + (err.message || 'Please check your connection'));
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this promo code?')) return;
        try { await adminPromoCodeAPI.deletePromoCode(id); fetchAll(); }
        catch (err) { alert('Failed to delete'); }
    };

    // Filter
    const filteredCodes = codes.filter(c => {
        const matchSearch = !searchTerm || c.code.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
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
                    <span className="promo-stat-value">{stats.total}</span>
                </div>
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Active Promo Codes</span>
                    <span className="promo-stat-value promo-val-green">{stats.active}</span>
                </div>
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Expired Codes</span>
                    <span className="promo-stat-value promo-val-red">{stats.expired}</span>
                </div>
                <div className="promo-stat-card">
                    <span className="promo-stat-label">Total Uses</span>
                    <span className="promo-stat-value">{stats.total_used}</span>
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
                <FilterDropdown
                    label={statusFilter}
                    options={['All Statuses', 'Active', 'Expired', 'Inactive', 'Scheduled', 'Limit Reached']}
                    onSelect={setStatusFilter}
                />
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
                            <th>USES</th>
                            <th>EXPIRY DATE</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCodes.length === 0 ? (
                            <tr><td colSpan="8" className="promo-empty">No promo codes found</td></tr>
                        ) : (
                            filteredCodes.map(code => {
                                const cfg = STATUS_BADGE[code.status] || STATUS_BADGE.Active;
                                const discountLabel = code.discount_type === 'percentage'
                                    ? `${code.discount_value}%`
                                    : `₹${code.discount_value}`;
                                return (
                                    <tr key={code.id}>
                                        <td className="promo-code-cell">{code.code}</td>
                                        <td>{discountLabel}</td>
                                        <td>₹{parseFloat(code.min_order_amount).toLocaleString('en-IN')}</td>
                                        <td className="promo-maxd">{code.max_discount ? `₹${code.max_discount}` : '—'}</td>
                                        <td>{code.times_used}{code.usage_limit > 0 ? `/${code.usage_limit}` : ''}</td>
                                        <td className="promo-date">{code.valid_to ? new Date(code.valid_to).toLocaleDateString('en-IN') : '—'}</td>
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
                                <div className="promo-form-group">
                                    <label><Tag size={14} /> Code *</label>
                                    <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required maxLength={30} placeholder="e.g. WELCOME20" style={{ textTransform: 'uppercase' }} />
                                </div>
                                <div className="promo-form-group">
                                    <label><Percent size={14} /> Discount Type</label>
                                    <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="flat">Flat Amount (₹)</option>
                                    </select>
                                </div>
                                <div className="promo-form-group">
                                    <label>Discount Value *</label>
                                    <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required min={0} step="0.01" placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 100'} />
                                </div>
                                <div className="promo-form-group">
                                    <label>Min Order Amount (₹)</label>
                                    <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} min={0} step="0.01" placeholder="0" />
                                </div>
                                <div className="promo-form-group">
                                    <label>Max Discount Cap (₹)</label>
                                    <input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} min={0} step="0.01" placeholder="No limit" />
                                </div>
                                <div className="promo-form-group">
                                    <label>Usage Limit (0 = unlimited)</label>
                                    <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })} min={0} />
                                </div>
                                <div className="promo-form-group promo-full">
                                    <label>Description</label>
                                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={200} placeholder="e.g. Welcome discount for new users" />
                                </div>
                                <div className="promo-form-group">
                                    <label><Calendar size={14} /> Valid From</label>
                                    <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
                                </div>
                                <div className="promo-form-group">
                                    <label><Calendar size={14} /> Valid To</label>
                                    <input type="datetime-local" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} />
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
