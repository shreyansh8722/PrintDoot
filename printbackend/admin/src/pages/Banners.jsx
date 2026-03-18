import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Image, Upload, CloudUpload, X, Pencil, Trash2, Plus, CheckCircle,
    GripVertical, Eye, Monitor, Smartphone, LayoutGrid, Star
} from 'lucide-react';
import { adminBannerAPI, adminCatalogAPI, adminUploadAPI } from '../services/api';
import './Banners.css';

/* ═══════════════════════════════════════════════════════════════
   Reusable Drag-and-Drop Upload Zone
   ═══════════════════════════════════════════════════════════════ */
const DragDropZone = ({ onUpload, folder, label, accept = 'image/*', multiple = false, existingUrl = '' }) => {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(existingUrl);
    const [progress, setProgress] = useState(0);
    const inputRef = useRef(null);

    useEffect(() => { setPreview(existingUrl); }, [existingUrl]);

    const uploadFile = async (file) => {
        setUploading(true); setProgress(0);
        try {
            // simulate progress
            const interval = setInterval(() => setProgress(p => Math.min(p + 20, 90)), 200);
            const res = await adminUploadAPI.uploadImage(file, folder);
            clearInterval(interval); setProgress(100);
            const url = res.data.url;
            setPreview(url);
            onUpload(url, file);
            setTimeout(() => setProgress(0), 800);
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.error || err.message));
        } finally { setUploading(false); }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault(); setDragOver(false);
        const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
        if (files.length) uploadFile(files[0]);
    }, [folder]);

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files[0]) uploadFile(files[0]);
    };

    return (
        <div
            className={`dd-zone ${dragOver ? 'dd-over' : ''} ${preview ? 'dd-has-preview' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && inputRef.current?.click()}
        >
            <input
                ref={inputRef} type="file" accept={accept}
                onChange={handleFileSelect} style={{ display: 'none' }}
                multiple={multiple}
            />
            {preview ? (
                <div className="dd-preview-wrap">
                    <img src={preview} alt="Preview" className="dd-preview-img" />
                    <div className="dd-overlay">
                        <CloudUpload size={20} />
                        <span>Drop to replace</span>
                    </div>
                </div>
            ) : (
                <div className="dd-placeholder">
                    {uploading ? (
                        <>
                            <div className="dd-progress-ring">
                                <svg viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#00897b" strokeWidth="3"
                                        strokeDasharray={`${progress} ${100 - progress}`} strokeDashoffset="25" />
                                </svg>
                            </div>
                            <span className="dd-uploading-text">Uploading to S3...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={28} className="dd-upload-icon" />
                            <span className="dd-label">{label || 'Drag & drop image here'}</span>
                            <span className="dd-sublabel">or click to browse • Max 10MB</span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   SITE IMAGES PAGE
   ═══════════════════════════════════════════════════════════════ */
const TABS = [
    { key: 'hero', label: 'Hero Banners', icon: Monitor },
    { key: 'category', label: 'Category Images', icon: LayoutGrid },
    { key: 'product', label: 'Product Images', icon: Image },
];

const POSITION_MAP = {
    hero: [
        { value: 'hero', label: 'Hero Banner (Homepage)' },
        { value: 'promo', label: 'Promotional Banner' },
        { value: 'popup', label: 'Popup Banner' },
    ],
    category: [
        { value: 'category', label: 'Category Page Banner' },
        { value: 'sidebar', label: 'Sidebar Banner' },
    ],
};

const Banners = () => {
    const [activeTab, setActiveTab] = useState('hero');
    const [banners, setBanners] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    // Banner form
    const emptyBanner = {
        title: '', subtitle: '', image_url: '', mobile_image_url: '',
        link: '', position: 'hero', is_active: true, display_order: 0,
    };
    const [form, setForm] = useState(emptyBanner);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bannersRes, catsRes, prodsRes] = await Promise.allSettled([
                adminBannerAPI.getBanners(),
                adminCatalogAPI.getCategories(),
                adminCatalogAPI.getProducts({ page_size: 50 }),
            ]);
            if (bannersRes.status === 'fulfilled') {
                const d = bannersRes.value.data;
                setBanners(Array.isArray(d) ? d : d.results || []);
            }
            if (catsRes.status === 'fulfilled') {
                const d = catsRes.value.data;
                setCategories(Array.isArray(d) ? d : d.results || []);
            }
            if (prodsRes.status === 'fulfilled') {
                const d = prodsRes.value.data;
                setProducts(Array.isArray(d) ? d : d.results || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Banner CRUD
    const openBannerModal = (banner = null) => {
        setEditing(banner);
        setForm(banner ? {
            title: banner.title || '', subtitle: banner.subtitle || '',
            image_url: banner.image_url || '', mobile_image_url: banner.mobile_image_url || '',
            link: banner.link || '', position: banner.position || 'hero',
            is_active: banner.is_active ?? true, display_order: banner.display_order || 0,
        } : emptyBanner);
        setShowModal(true);
    };

    const saveBanner = async (e) => {
        e.preventDefault();
        try {
            const submitData = { ...form };
            // Django URLField rejects empty strings — omit optional URL fields if empty
            if (!submitData.mobile_image_url) delete submitData.mobile_image_url;
            if (!submitData.link) delete submitData.link;
            if (editing) await adminBannerAPI.updateBanner(editing.id, submitData);
            else await adminBannerAPI.createBanner(submitData);
            setShowModal(false); fetchAll();
            alert(editing ? 'Banner updated!' : 'Banner created!');
        } catch (err) {
            const errData = err.response?.data;
            const msg = errData ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n') : err.message;
            alert('Failed to save banner:\n' + msg);
        }
    };

    const deleteBanner = async (id) => {
        if (!window.confirm('Delete this banner?')) return;
        try { await adminBannerAPI.deleteBanner(id); fetchAll(); }
        catch (e) { alert('Failed'); }
    };

    // Category image update
    const updateCategoryImage = async (cat, url) => {
        try {
            await adminCatalogAPI.updateCategory(cat.id, { image: url });
            fetchAll();
        } catch (err) { console.error(err); }
    };

    // Product image update
    const updateProductImage = async (prod, url) => {
        try {
            await adminCatalogAPI.patchProduct(prod.id, { primary_image: url });
            fetchAll();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="si-loading"><div className="si-spinner"></div><p>Loading site images...</p></div>;

    return (
        <div className="si-page">
            <div className="si-header">
                <div>
                    <h1 className="si-title">Site Images</h1>
                    <p className="si-subtitle">Manage all images used across your website — hero banners, category grids, and product photos.</p>
                </div>
                {activeTab === 'hero' && (
                    <button className="si-add-btn" onClick={() => openBannerModal()}>
                        <Plus size={16} /> New Banner
                    </button>
                )}
            </div>

            {/* ═══ TAB SWITCHER ═══ */}
            <div className="si-tab-bar">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`si-tab ${activeTab === t.key ? 'si-tab-active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ HERO BANNERS ═══ */}
            {activeTab === 'hero' && (
                <div className="si-grid">
                    {banners.length === 0 ? (
                        <div className="si-empty-card" onClick={() => openBannerModal()}>
                            <Plus size={32} />
                            <span>Add your first hero banner</span>
                        </div>
                    ) : (
                        banners.map(b => (
                            <div key={b.id} className="si-card">
                                <div className="si-card-img-wrap">
                                    {b.image_url ? (
                                        <img src={b.image_url} alt={b.title} className="si-card-img" />
                                    ) : (
                                        <DragDropZone
                                            folder="banners"
                                            label="Drop banner image"
                                            onUpload={(url) => {
                                                adminBannerAPI.updateBanner(b.id, { image_url: url });
                                                fetchAll();
                                            }}
                                        />
                                    )}
                                    <div className="si-card-actions">
                                        <button onClick={() => openBannerModal(b)} className="si-card-action"><Pencil size={14} /></button>
                                        <button onClick={() => deleteBanner(b.id)} className="si-card-action si-delete"><Trash2 size={14} /></button>
                                    </div>
                                    {b.is_active && <span className="si-active-badge"><CheckCircle size={12} /> Active</span>}
                                </div>
                                <div className="si-card-info">
                                    <h3>{b.title}</h3>
                                    <span className="si-card-pos">{b.position}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ═══ CATEGORY IMAGES ═══ */}
            {activeTab === 'category' && (
                <div className="si-grid si-grid-cats">
                    {categories.map(cat => (
                        <div key={cat.id} className="si-card">
                            <div className="si-card-img-wrap si-cat-img">
                                {cat.image ? (
                                    <div className="si-cat-existing">
                                        <img src={cat.image} alt={cat.name} className="si-card-img" />
                                        <div className="si-card-actions">
                                            <DragDropZone
                                                folder="categories"
                                                label="Drop to replace"
                                                existingUrl=""
                                                onUpload={(url) => updateCategoryImage(cat, url)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <DragDropZone
                                        folder="categories"
                                        label={`Drop ${cat.name} image`}
                                        onUpload={(url) => updateCategoryImage(cat, url)}
                                    />
                                )}
                            </div>
                            <div className="si-card-info">
                                <h3>{cat.name}</h3>
                                <span className="si-card-pos">{cat.is_active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ PRODUCT IMAGES ═══ */}
            {activeTab === 'product' && (
                <div className="si-grid si-grid-prods">
                    {products.slice(0, 20).map(p => (
                        <div key={p.id} className="si-card si-card-product">
                            <div className="si-card-img-wrap si-prod-img">
                                {p.primary_image ? (
                                    <div className="si-prod-existing">
                                        <img src={p.primary_image} alt={p.name} className="si-card-img" />
                                        <div className="si-overlay-replace">
                                            <DragDropZone
                                                folder="products"
                                                label="Drop to replace"
                                                existingUrl=""
                                                onUpload={(url) => updateProductImage(p, url)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <DragDropZone
                                        folder="products"
                                        label="Drop product image"
                                        onUpload={(url) => updateProductImage(p, url)}
                                    />
                                )}
                            </div>
                            <div className="si-card-info">
                                <h3 title={p.name}>{p.name?.length > 30 ? p.name.slice(0, 30) + '...' : p.name}</h3>
                                <span className="si-card-pos">₹{p.base_price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ BANNER CREATE/EDIT MODAL ═══ */}
            {showModal && (
                <div className="si-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="si-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="si-modal-header">
                            <h2>{editing ? 'Edit Banner' : 'New Banner'}</h2>
                            <button className="si-modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={saveBanner} className="si-modal-body">
                            {/* Drag & Drop Image Upload */}
                            <div className="si-modal-upload">
                                <DragDropZone
                                    folder="banners"
                                    label="Drag & drop banner image"
                                    existingUrl={form.image_url}
                                    onUpload={(url) => setForm(f => ({ ...f, image_url: url }))}
                                />
                            </div>

                            <div className="si-form-grid">
                                <div className="si-form-group si-full">
                                    <label>Title</label>
                                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                                </div>
                                <div className="si-form-group si-full">
                                    <label>Subtitle</label>
                                    <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                                </div>
                                <div className="si-form-group">
                                    <label>Position</label>
                                    <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                                        <option value="hero">Hero Banner (Homepage)</option>
                                        <option value="promo">Promotional Banner</option>
                                        <option value="sidebar">Sidebar Banner</option>
                                        <option value="category">Category Page Banner</option>
                                        <option value="popup">Popup Banner</option>
                                    </select>
                                </div>
                                <div className="si-form-group">
                                    <label>Link</label>
                                    <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/products" />
                                </div>
                                <div className="si-form-group">
                                    <label>Display Order</label>
                                    <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="si-form-group">
                                    <label className="si-checkbox">
                                        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                                        Active
                                    </label>
                                </div>
                            </div>

                            {/* Mobile Image */}
                            <div className="si-modal-mobile-upload">
                                <label className="si-mobile-label"><Smartphone size={14} /> Mobile Image (optional)</label>
                                <DragDropZone
                                    folder="banners"
                                    label="Drop mobile image"
                                    existingUrl={form.mobile_image_url}
                                    onUpload={(url) => setForm(f => ({ ...f, mobile_image_url: url }))}
                                />
                            </div>

                            <div className="si-modal-footer">
                                <button type="button" className="si-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="si-btn-save">{editing ? 'Update' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banners;
