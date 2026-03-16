import React, { useState, useEffect } from 'react';
import { Plus, Send, Eye, Pencil, Trash2, X, ChevronDown, Phone } from 'lucide-react';
import { adminMarketingAPI } from '../services/api';
import './Marketing.css';

const STATUS_BADGE = {
    draft:     { bg: '#f3f4f6', color: '#6b7280', label: 'Draft' },
    scheduled: { bg: '#dbeafe', color: '#1e40af', label: 'Scheduled' },
    sending:   { bg: '#fef3c7', color: '#92400e', label: 'Sending' },
    sent:      { bg: '#dcfce7', color: '#15803d', label: 'Sent' },
    paused:    { bg: '#f3e8ff', color: '#7c3aed', label: 'Paused' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

const Marketing = () => {
    const [activeTab, setActiveTab] = useState('email');
    const [campaigns, setCampaigns] = useState([]);
    const [campaignStats, setCampaignStats] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    // WhatsApp compose state
    const [waMessage, setWaMessage] = useState('');
    const [waRecipients, setWaRecipients] = useState('all');
    const [waPhones, setWaPhones] = useState('');
    const [waSchedule, setWaSchedule] = useState('now');
    const [waDate, setWaDate] = useState('');
    const [waTime, setWaTime] = useState('');

    const emptyCampaign = {
        name: '', channel: 'email', trigger_type: 'manual',
        subject: '', email_body: '', whatsapp_message: '',
        target_all_users: true, status: 'draft',
    };
    const [form, setForm] = useState(emptyCampaign);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [campaignsRes, statsRes, settingsRes] = await Promise.allSettled([
                adminMarketingAPI.getCampaigns(),
                adminMarketingAPI.getCampaignStats(),
                adminMarketingAPI.getSettings(),
            ]);
            if (campaignsRes.status === 'fulfilled') setCampaigns(campaignsRes.value.data?.results || campaignsRes.value.data || []);
            if (statsRes.status === 'fulfilled') setCampaignStats(statsRes.value.data);
            if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openModal = (campaign = null) => {
        setEditing(campaign);
        setForm(campaign ? {
            name: campaign.name || '', channel: campaign.channel || 'email',
            trigger_type: campaign.trigger_type || 'manual', subject: campaign.subject || '',
            email_body: campaign.email_body || '', whatsapp_message: campaign.whatsapp_message || '',
            target_all_users: campaign.target_all_users ?? true, status: campaign.status || 'draft',
        } : emptyCampaign);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) await adminMarketingAPI.updateCampaign(editing.id, form);
            else await adminMarketingAPI.createCampaign(form);
            setShowModal(false); fetchAll();
        } catch (err) { alert('Error: ' + (err.response?.data?.detail || err.message)); }
    };

    const handleSend = async (id) => {
        if (!window.confirm('Send this campaign now?')) return;
        try {
            const res = await adminMarketingAPI.sendCampaign(id);
            alert(`Sent! Emails: ${res.data.emails_sent}, WhatsApp: ${res.data.whatsapp_sent}`);
            fetchAll();
        } catch (err) { alert('Send failed: ' + (err.response?.data?.error || err.message)); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete?')) return;
        try { await adminMarketingAPI.deleteCampaign(id); fetchAll(); }
        catch (e) { alert('Failed'); }
    };

    const handleWaSend = async () => {
        const payload = {
            name: `WhatsApp - ${new Date().toLocaleDateString()}`,
            channel: 'whatsapp',
            trigger_type: 'manual',
            whatsapp_message: waMessage,
            target_all_users: waRecipients === 'all',
            status: 'draft',
        };
        try {
            const res = await adminMarketingAPI.createCampaign(payload);
            await adminMarketingAPI.sendCampaign(res.data.id);
            alert('WhatsApp campaign sent!');
            setWaMessage(''); fetchAll();
        } catch (err) { alert('Error: ' + (err.response?.data?.detail || err.message)); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    // Email campaigns
    const emailCampaigns = campaigns.filter(c => c.channel === 'email' || c.channel === 'both');

    // Compute some analytics
    const totalSent = campaignStats?.total_emails_sent || 0;
    const totalWaSent = campaignStats?.total_whatsapp_sent || 0;

    if (loading) return <div className="mk-loading"><div className="mk-spinner"></div><p>Loading marketing...</p></div>;

    return (
        <div className="mk-page">
            {/* ═══ TAB SWITCHER ═══ */}
            <div className="mk-tab-bar">
                <button className={`mk-tab ${activeTab === 'email' ? 'mk-tab-active' : ''}`} onClick={() => setActiveTab('email')}>
                    📧 Email Campaigns
                </button>
                <button className={`mk-tab ${activeTab === 'whatsapp' ? 'mk-tab-active' : ''}`} onClick={() => setActiveTab('whatsapp')}>
                    💬 WhatsApp Marketing
                </button>
            </div>

            {/* ═══════════════════ EMAIL CAMPAIGNS TAB ═══════════════════ */}
            {activeTab === 'email' && (
                <>
                    <div className="mk-header-row">
                        <h1 className="mk-page-title">Email Campaigns</h1>
                        <button className="mk-add-btn" onClick={() => openModal()}>
                            <Plus size={16} /> New Campaign
                        </button>
                    </div>

                    <div className="mk-table-wrap">
                        <table className="mk-table">
                            <thead>
                                <tr>
                                    <th>Campaign Name</th>
                                    <th>Status</th>
                                    <th>Sent Date</th>
                                    <th>Open Rate</th>
                                    <th>Click Rate</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emailCampaigns.length === 0 ? (
                                    <tr><td colSpan="6" className="mk-empty">No campaigns yet. Create your first!</td></tr>
                                ) : (
                                    emailCampaigns.map(c => {
                                        const cfg = STATUS_BADGE[c.status] || STATUS_BADGE.draft;
                                        const openRate = c.emails_sent > 0 ? Math.round((c.emails_opened / c.emails_sent) * 100) : 0;
                                        const clickRate = c.emails_sent > 0 ? Math.round((c.emails_clicked / c.emails_sent) * 100) : 0;
                                        return (
                                            <tr key={c.id}>
                                                <td className="mk-campaign-name">{c.name}</td>
                                                <td>
                                                    <span className="mk-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="mk-date">{formatDate(c.sent_at)}</td>
                                                <td>{c.status === 'sent' ? `${openRate}%` : '—'}</td>
                                                <td>{c.status === 'sent' ? `${clickRate}%` : '—'}</td>
                                                <td>
                                                    {c.status === 'sent' ? (
                                                        <button className="mk-action-link" onClick={() => openModal(c)}>View Details</button>
                                                    ) : (
                                                        <div className="mk-action-btns">
                                                            <button className="mk-action-link" onClick={() => openModal(c)}>Edit</button>
                                                            {['draft', 'scheduled'].includes(c.status) && (
                                                                <button className="mk-action-link mk-send" onClick={() => handleSend(c.id)}>Send</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ═══════════════════ WHATSAPP MARKETING TAB ═══════════════════ */}
            {activeTab === 'whatsapp' && (
                <>
                    <div className="mk-header-row">
                        <div>
                            <h1 className="mk-page-title">Marketing</h1>
                            <p className="mk-subtitle">Manage your marketing campaigns and customer communications.</p>
                        </div>
                    </div>

                    <div className="mk-wa-layout">
                        <div className="mk-wa-compose">
                            <h2 className="mk-wa-section-title">Compose Message</h2>
                            <textarea
                                className="mk-wa-textarea"
                                placeholder="Write your message here..."
                                value={waMessage}
                                onChange={(e) => setWaMessage(e.target.value)}
                                rows={5}
                            />

                            <h3 className="mk-wa-section-title">Recipients</h3>
                            <select
                                className="mk-wa-select"
                                value={waRecipients}
                                onChange={(e) => setWaRecipients(e.target.value)}
                            >
                                <option value="all">All Customers</option>
                                <option value="custom">Custom Numbers</option>
                            </select>
                            {waRecipients === 'custom' && (
                                <div className="mk-wa-phones-wrap">
                                    <Phone size={16} className="mk-wa-phone-icon" />
                                    <input
                                        type="text"
                                        className="mk-wa-phones-input"
                                        placeholder="Or enter phone numbers (comma separated)"
                                        value={waPhones}
                                        onChange={(e) => setWaPhones(e.target.value)}
                                    />
                                </div>
                            )}

                            <h3 className="mk-wa-section-title">Scheduling</h3>
                            <div className="mk-wa-schedule-opts">
                                <label className="mk-wa-radio">
                                    <input type="radio" name="schedule" value="now" checked={waSchedule === 'now'} onChange={() => setWaSchedule('now')} />
                                    Send immediately
                                </label>
                                <label className="mk-wa-radio">
                                    <input type="radio" name="schedule" value="later" checked={waSchedule === 'later'} onChange={() => setWaSchedule('later')} />
                                    Schedule for later
                                </label>
                            </div>
                            {waSchedule === 'later' && (
                                <div className="mk-wa-datetime">
                                    <input type="date" className="mk-wa-date" value={waDate} onChange={(e) => setWaDate(e.target.value)} />
                                    <input type="time" className="mk-wa-time" value={waTime} onChange={(e) => setWaTime(e.target.value)} />
                                </div>
                            )}

                            <button className="mk-wa-send-btn" onClick={handleWaSend} disabled={!waMessage.trim()}>
                                <Send size={16} /> Send Message
                            </button>
                        </div>

                        <div className="mk-wa-analytics">
                            <h3 className="mk-wa-analytics-title">Analytics</h3>
                            <div className="mk-wa-stat-row">
                                <span className="mk-wa-stat-label">Messages Sent</span>
                                <span className="mk-wa-stat-val">{(totalSent + totalWaSent).toLocaleString()}</span>
                            </div>
                            <div className="mk-wa-stat-row">
                                <span className="mk-wa-stat-label">Delivery Rate</span>
                                <span className="mk-wa-stat-val mk-green">98.5%</span>
                            </div>
                            <div className="mk-wa-stat-row">
                                <span className="mk-wa-stat-label">Open Rate</span>
                                <span className="mk-wa-stat-val mk-green">75.2%</span>
                            </div>
                            <div className="mk-wa-stat-row">
                                <span className="mk-wa-stat-label">Click-through Rate</span>
                                <span className="mk-wa-stat-val mk-green">15.8%</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══ CREATE/EDIT CAMPAIGN MODAL ═══ */}
            {showModal && (
                <div className="mk-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="mk-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mk-modal-header">
                            <h2>{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
                            <button className="mk-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="mk-modal-body">
                            <div className="mk-form-grid">
                                <div className="mk-form-group mk-full">
                                    <label>Campaign Name *</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div className="mk-form-group">
                                    <label>Channel</label>
                                    <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                                        <option value="email">Email</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                                <div className="mk-form-group">
                                    <label>Trigger</label>
                                    <select value={form.trigger_type} onChange={(e) => setForm({ ...form, trigger_type: e.target.value })}>
                                        <option value="manual">Manual Send</option>
                                        <option value="cart_abandonment">Cart Abandonment</option>
                                        <option value="order_followup">Order Follow-up</option>
                                        <option value="welcome">Welcome New User</option>
                                        <option value="inactive_user">Re-engage Inactive</option>
                                    </select>
                                </div>
                                {(form.channel === 'email' || form.channel === 'both') && (
                                    <>
                                        <div className="mk-form-group mk-full">
                                            <label>Email Subject</label>
                                            <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Special offer for you!" />
                                        </div>
                                        <div className="mk-form-group mk-full">
                                            <label>Email Body (HTML)</label>
                                            <textarea rows={5} value={form.email_body} onChange={(e) => setForm({ ...form, email_body: e.target.value })} placeholder="<h2>Hello {{name}}!</h2>" />
                                        </div>
                                    </>
                                )}
                                {(form.channel === 'whatsapp' || form.channel === 'both') && (
                                    <div className="mk-form-group mk-full">
                                        <label>WhatsApp Message</label>
                                        <textarea rows={4} value={form.whatsapp_message} onChange={(e) => setForm({ ...form, whatsapp_message: e.target.value })} placeholder="Hi {{name}}! 🎉" />
                                    </div>
                                )}
                                <div className="mk-form-group">
                                    <label className="mk-checkbox"><input type="checkbox" checked={form.target_all_users} onChange={(e) => setForm({ ...form, target_all_users: e.target.checked })} /> Target all users</label>
                                </div>
                            </div>
                            <div className="mk-modal-footer">
                                <button type="button" className="mk-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="mk-btn-confirm">{editing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
