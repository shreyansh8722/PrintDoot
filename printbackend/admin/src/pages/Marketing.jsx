import React, { useState, useEffect } from 'react';
import { adminMarketingAPI } from '../services/api';
import './Marketing.css';

const Marketing = () => {
    const [activeTab, setActiveTab] = useState('campaigns');
    const [campaigns, setCampaigns] = useState([]);
    const [abandonedCarts, setAbandonedCarts] = useState([]);
    const [campaignStats, setCampaignStats] = useState(null);
    const [cartStats, setCartStats] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    const [campaignForm, setCampaignForm] = useState({
        name: '',
        channel: 'email',
        trigger_type: 'manual',
        subject: '',
        email_body: '',
        whatsapp_message: '',
        target_all_users: true,
        status: 'draft',
    });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [campaignsRes, cartsRes, campaignStatsRes, cartStatsRes, settingsRes] = await Promise.allSettled([
                adminMarketingAPI.getCampaigns(),
                adminMarketingAPI.getAbandonedCarts(),
                adminMarketingAPI.getCampaignStats(),
                adminMarketingAPI.getAbandonedCartStats(),
                adminMarketingAPI.getSettings(),
            ]);

            if (campaignsRes.status === 'fulfilled') setCampaigns(campaignsRes.value.data?.results || campaignsRes.value.data || []);
            if (cartsRes.status === 'fulfilled') setAbandonedCarts(cartsRes.value.data?.results || cartsRes.value.data || []);
            if (campaignStatsRes.status === 'fulfilled') setCampaignStats(campaignStatsRes.value.data);
            if (cartStatsRes.status === 'fulfilled') setCartStats(cartStatsRes.value.data);
            if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data);
        } catch (error) {
            console.error('Error fetching marketing data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCampaignModal = (campaign = null) => {
        setEditingCampaign(campaign);
        setCampaignForm(campaign ? {
            name: campaign.name || '',
            channel: campaign.channel || 'email',
            trigger_type: campaign.trigger_type || 'manual',
            subject: campaign.subject || '',
            email_body: campaign.email_body || '',
            whatsapp_message: campaign.whatsapp_message || '',
            target_all_users: campaign.target_all_users ?? true,
            status: campaign.status || 'draft',
        } : {
            name: '', channel: 'email', trigger_type: 'manual',
            subject: '', email_body: '', whatsapp_message: '',
            target_all_users: true, status: 'draft',
        });
        setShowCampaignModal(true);
    };

    const handleCampaignSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCampaign) {
                await adminMarketingAPI.updateCampaign(editingCampaign.id, campaignForm);
                alert('Campaign updated!');
            } else {
                await adminMarketingAPI.createCampaign(campaignForm);
                alert('Campaign created!');
            }
            setShowCampaignModal(false);
            fetchAllData();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleSendCampaign = async (id) => {
        if (!window.confirm('Are you sure you want to send this campaign?')) return;
        try {
            const response = await adminMarketingAPI.sendCampaign(id);
            alert(`Campaign sent! Emails: ${response.data.emails_sent}, WhatsApp: ${response.data.whatsapp_sent}`);
            fetchAllData();
        } catch (error) {
            alert('Send failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!window.confirm('Delete this campaign?')) return;
        try {
            await adminMarketingAPI.deleteCampaign(id);
            fetchAllData();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleSendReminder = async (cartId) => {
        try {
            const response = await adminMarketingAPI.sendCartReminder(cartId);
            alert(`Reminder sent! Email: ${response.data.email_sent ? '✅' : '❌'}, WhatsApp: ${response.data.whatsapp_sent ? '✅' : '❌'}`);
            fetchAllData();
        } catch (error) {
            alert('Failed: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            await adminMarketingAPI.updateSettings(settings);
            alert('Settings updated!');
            setShowSettingsModal(false);
        } catch (error) {
            alert('Error updating settings');
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const formatCurrency = (a) => a ? `₹${parseFloat(a).toLocaleString('en-IN')}` : '₹0';

    const statusColor = (s) => {
        const map = { draft: '#6b7280', scheduled: '#3b82f6', sending: '#f59e0b', sent: '#10b981', paused: '#9ca3af', cancelled: '#ef4444' };
        return map[s] || '#6b7280';
    };

    const cartStatusColor = (s) => {
        const map = { abandoned: '#ef4444', reminder_sent: '#f59e0b', recovered: '#10b981', expired: '#9ca3af' };
        return map[s] || '#6b7280';
    };

    if (loading) return <div className="loading">Loading marketing data...</div>;

    return (
        <div className="marketing-page">
            <div className="page-header">
                <h1>Marketing</h1>
                <div className="header-actions">
                    <button onClick={() => setShowSettingsModal(true)} className="btn-secondary">⚙️ Settings</button>
                    <button onClick={() => openCampaignModal()} className="btn-primary">+ New Campaign</button>
                </div>
            </div>

            {/* Stats */}
            <div className="marketing-stats-grid">
                {campaignStats && (
                    <>
                        <div className="mkt-stat"><div className="mkt-stat-value">{campaignStats.total_campaigns}</div><div className="mkt-stat-label">Total Campaigns</div></div>
                        <div className="mkt-stat"><div className="mkt-stat-value">{campaignStats.active_campaigns}</div><div className="mkt-stat-label">Active</div></div>
                        <div className="mkt-stat"><div className="mkt-stat-value">{campaignStats.total_emails_sent}</div><div className="mkt-stat-label">Emails Sent</div></div>
                        <div className="mkt-stat"><div className="mkt-stat-value">{campaignStats.total_whatsapp_sent}</div><div className="mkt-stat-label">WhatsApp Sent</div></div>
                    </>
                )}
                {cartStats && (
                    <>
                        <div className="mkt-stat"><div className="mkt-stat-value">{cartStats.abandoned}</div><div className="mkt-stat-label">Abandoned Carts</div></div>
                        <div className="mkt-stat"><div className="mkt-stat-value text-success">{cartStats.recovered}</div><div className="mkt-stat-label">Recovered</div></div>
                        <div className="mkt-stat"><div className="mkt-stat-value">{cartStats.recovery_rate}%</div><div className="mkt-stat-label">Recovery Rate</div></div>
                        <div className="mkt-stat"><div className="mkt-stat-value">{formatCurrency(cartStats.revenue_at_risk)}</div><div className="mkt-stat-label">Revenue at Risk</div></div>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="marketing-tabs">
                <button className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
                    📧 Campaigns ({campaigns.length})
                </button>
                <button className={`tab-btn ${activeTab === 'carts' ? 'active' : ''}`} onClick={() => setActiveTab('carts')}>
                    🛒 Abandoned Carts ({abandonedCarts.length})
                </button>
            </div>

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
                <div className="table-container">
                    <table className="marketing-table">
                        <thead>
                            <tr>
                                <th>Campaign</th>
                                <th>Channel</th>
                                <th>Status</th>
                                <th>Recipients</th>
                                <th>Sent</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length === 0 ? (
                                <tr><td colSpan="7" className="text-center">No campaigns yet. Create your first!</td></tr>
                            ) : campaigns.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.name}</strong><br /><small className="text-muted">{c.trigger_type}</small></td>
                                    <td>
                                        <span className="channel-badge">{c.channel === 'email' ? '📧' : c.channel === 'whatsapp' ? '💬' : '📧💬'} {c.channel}</span>
                                    </td>
                                    <td>
                                        <span className="campaign-status" style={{ color: statusColor(c.status) }}>
                                            ● {c.status}
                                        </span>
                                    </td>
                                    <td>{c.total_recipients}</td>
                                    <td>{c.emails_sent} / {c.whatsapp_sent}</td>
                                    <td>{formatDate(c.sent_at || c.created_at)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-view" onClick={() => openCampaignModal(c)}>Edit</button>
                                            {['draft', 'scheduled'].includes(c.status) && (
                                                <button className="btn-toggle" onClick={() => handleSendCampaign(c.id)}>Send</button>
                                            )}
                                            <button className="btn-delete" onClick={() => handleDeleteCampaign(c.id)}>Del</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Abandoned Carts Tab */}
            {activeTab === 'carts' && (
                <div className="table-container">
                    <table className="marketing-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Cart Total</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Reminders</th>
                                <th>Abandoned</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {abandonedCarts.length === 0 ? (
                                <tr><td colSpan="7" className="text-center">No abandoned carts</td></tr>
                            ) : abandonedCarts.map(cart => (
                                <tr key={cart.id}>
                                    <td>
                                        <strong>{cart.user?.username || cart.user?.email || '—'}</strong>
                                        <br /><small className="text-muted">{cart.user?.email || ''}</small>
                                    </td>
                                    <td><strong>{formatCurrency(cart.cart_total)}</strong></td>
                                    <td>{cart.cart_data?.length || 0} items</td>
                                    <td>
                                        <span className="cart-status" style={{ color: cartStatusColor(cart.status) }}>
                                            ● {cart.status}
                                        </span>
                                    </td>
                                    <td>{cart.reminder_count}</td>
                                    <td>{formatDate(cart.abandoned_at)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {cart.status !== 'recovered' && cart.status !== 'expired' && (
                                                <button className="btn-toggle" onClick={() => handleSendReminder(cart.id)}>
                                                    📩 Remind
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Campaign Create/Edit Modal */}
            {showCampaignModal && (
                <div className="modal-overlay" onClick={() => setShowCampaignModal(false)}>
                    <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h2>
                            <button className="modal-close" onClick={() => setShowCampaignModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCampaignSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Campaign Name *</label>
                                        <input type="text" className="form-input" required
                                            value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Channel</label>
                                        <select className="form-select" value={campaignForm.channel}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}>
                                            <option value="email">Email</option>
                                            <option value="whatsapp">WhatsApp</option>
                                            <option value="both">Email + WhatsApp</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Trigger Type</label>
                                        <select className="form-select" value={campaignForm.trigger_type}
                                            onChange={(e) => setCampaignForm({ ...campaignForm, trigger_type: e.target.value })}>
                                            <option value="manual">Manual Send</option>
                                            <option value="cart_abandonment">Cart Abandonment</option>
                                            <option value="order_followup">Order Follow-up</option>
                                            <option value="welcome">Welcome New User</option>
                                            <option value="inactive_user">Re-engage Inactive</option>
                                            <option value="product_restock">Product Restock</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Target</label>
                                        <label className="checkbox-label">
                                            <input type="checkbox" checked={campaignForm.target_all_users}
                                                onChange={(e) => setCampaignForm({ ...campaignForm, target_all_users: e.target.checked })} />
                                            Target all users
                                        </label>
                                    </div>
                                </div>

                                {(campaignForm.channel === 'email' || campaignForm.channel === 'both') && (
                                    <>
                                        <div className="form-group">
                                            <label>Email Subject</label>
                                            <input type="text" className="form-input"
                                                value={campaignForm.subject} onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                                                placeholder="e.g. Special offer for you, {{name}}!" />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Body (HTML)</label>
                                            <textarea className="form-textarea" rows={6}
                                                value={campaignForm.email_body} onChange={(e) => setCampaignForm({ ...campaignForm, email_body: e.target.value })}
                                                placeholder="<h2>Hello {{name}}!</h2><p>Check out our latest offers...</p>" />
                                        </div>
                                    </>
                                )}

                                {(campaignForm.channel === 'whatsapp' || campaignForm.channel === 'both') && (
                                    <div className="form-group">
                                        <label>WhatsApp Message</label>
                                        <textarea className="form-textarea" rows={4}
                                            value={campaignForm.whatsapp_message} onChange={(e) => setCampaignForm({ ...campaignForm, whatsapp_message: e.target.value })}
                                            placeholder="Hi {{name}}! 🎉 Check out our exclusive deals..." />
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowCampaignModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">{editingCampaign ? 'Update' : 'Create'} Campaign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettingsModal && settings && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Marketing Settings</h2>
                            <button className="modal-close" onClick={() => setShowSettingsModal(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleUpdateSettings}>
                            <div className="modal-body">
                                <div className="settings-section">
                                    <h3>🛒 Cart Abandonment</h3>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={settings.cart_abandonment_enabled}
                                            onChange={(e) => setSettings({ ...settings, cart_abandonment_enabled: e.target.checked })} />
                                        Enable cart abandonment reminders
                                    </label>
                                    <div className="form-group">
                                        <label>Delay (minutes)</label>
                                        <input type="number" className="form-input" value={settings.cart_abandonment_delay_minutes}
                                            onChange={(e) => setSettings({ ...settings, cart_abandonment_delay_minutes: parseInt(e.target.value) })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Max Reminders</label>
                                        <input type="number" className="form-input" value={settings.cart_abandonment_max_reminders}
                                            onChange={(e) => setSettings({ ...settings, cart_abandonment_max_reminders: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="settings-section">
                                    <h3>💬 WhatsApp</h3>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={settings.whatsapp_enabled}
                                            onChange={(e) => setSettings({ ...settings, whatsapp_enabled: e.target.checked })} />
                                        Enable WhatsApp messaging
                                    </label>
                                    <div className="form-group">
                                        <label>API Provider</label>
                                        <input type="text" className="form-input" value={settings.whatsapp_api_provider || ''}
                                            onChange={(e) => setSettings({ ...settings, whatsapp_api_provider: e.target.value })}
                                            placeholder="twilio, wati, interakt, gupshup" />
                                    </div>
                                </div>
                                <div className="settings-section">
                                    <h3>📧 Email</h3>
                                    <label className="checkbox-label">
                                        <input type="checkbox" checked={settings.email_campaigns_enabled}
                                            onChange={(e) => setSettings({ ...settings, email_campaigns_enabled: e.target.checked })} />
                                        Enable email campaigns
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Settings</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Marketing;
