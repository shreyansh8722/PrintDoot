import React, { useState, useEffect, useRef, useCallback } from 'react';
import { adminCatalogAPI, adminUploadAPI } from '../services/api';
import { useDataCache } from '../contexts/DataCacheContext';
import ProductAttributesTab from '../components/ProductAttributesTab';
import ZakekeTab from '../components/ZakekeTab';
import {
    Package, CheckCircle, XCircle, Grid3X3,
    Plus, Search, Pencil, Trash2, ChevronLeft,
    ChevronRight, RefreshCw, Filter, X, Image,
    Upload, CloudUpload
} from 'lucide-react';
import './Products.css';
import '../components/ProductAttributes.css';

const ITEMS_PER_PAGE = 15;

/* ═══ Drag & Drop Multi-Image Upload Component ═══ */
const DragDropImageZone = ({ images, onImagesChange, folder = 'products' }) => {
    const [dragOver, setDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const inputRef = useRef(null);

    const uploadFiles = async (files) => {
        const imageFiles = [...files].filter(f => f.type.startsWith('image/'));
        if (!imageFiles.length) return;
        setUploading(true); setUploadProgress(0);
        const newImages = [...images];
        for (let i = 0; i < imageFiles.length; i++) {
            try {
                setUploadProgress(Math.round(((i) / imageFiles.length) * 100));
                const res = await adminUploadAPI.uploadImage(imageFiles[i], folder);
                newImages.push({ url: res.data.url, filename: imageFiles[i].name });
            } catch (err) {
                console.error('Upload failed for', imageFiles[i].name, err);
            }
        }
        setUploadProgress(100);
        onImagesChange(newImages);
        setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault(); setDragOver(false);
        uploadFiles(e.dataTransfer.files);
    }, [images]);

    const removeImage = (idx) => {
        const updated = images.filter((_, i) => i !== idx);
        onImagesChange(updated);
    };

    const setPrimary = (idx) => {
        const updated = [...images];
        const [item] = updated.splice(idx, 1);
        updated.unshift(item);
        onImagesChange(updated);
    };

    return (
        <div className="pdi-zone-wrap">
            {/* Existing images grid */}
            {images.length > 0 && (
                <div className="pdi-thumbs">
                    {images.map((img, idx) => (
                        <div key={idx} className={`pdi-thumb ${idx === 0 ? 'pdi-primary' : ''}`}>
                            <img src={img.url} alt={img.filename || 'Product'} />
                            {idx === 0 && <span className="pdi-primary-badge">Primary</span>}
                            <div className="pdi-thumb-actions">
                                {idx !== 0 && (
                                    <button type="button" onClick={() => setPrimary(idx)} className="pdi-set-primary" title="Set as primary">
                                        ★
                                    </button>
                                )}
                                <button type="button" onClick={() => removeImage(idx)} className="pdi-remove" title="Remove">
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Drop zone */}
            <div
                className={`pdi-dropzone ${dragOver ? 'pdi-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
            >
                <input
                    ref={inputRef} type="file" accept="image/*" multiple
                    onChange={(e) => uploadFiles(e.target.files)}
                    style={{ display: 'none' }}
                />
                {uploading ? (
                    <div className="pdi-uploading">
                        <div className="pdi-progress-bar">
                            <div className="pdi-progress-fill" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <span>Uploading to S3... {uploadProgress}%</span>
                    </div>
                ) : (
                    <div className="pdi-drop-content">
                        <CloudUpload size={24} />
                        <span className="pdi-drop-label">Drag & drop images here</span>
                        <span className="pdi-drop-sub">or click to browse • Multiple files • Max 10MB each</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const [stats, setStats] = useState({ total: 0, in_stock: 0, out_of_stock: 0, categories_count: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [filterCategory, setFilterCategory] = useState('');
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [productImages, setProductImages] = useState([]);
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const { fetchProducts, fetchCategories, fetchSubcategories, invalidateCache } = useDataCache();

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        sku: '',
        subcategory: '',
        description: '',
        base_price: '',
        stock_quantity: 0,
        is_active: true,
        discount_type: '',
        discount_value: 0,
        is_on_sale: false,
        primary_image: null,
        zakeke_product_id: '',
    });

    useEffect(() => {
        fetchProductsData();
        fetchCategoriesData();
        fetchSubcategoriesData();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await adminCatalogAPI.getProductStats();
            setStats(res.data);
        } catch (e) {
            console.error('Error fetching product stats:', e);
        }
    };

    const fetchProductsData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const { data, fromCache } = await fetchProducts({ search: searchTerm }, forceRefresh);
            setProducts(data);
            if (fromCache && !forceRefresh) {
                console.log('📦 Loaded products from cache');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            if (error.response?.status === 401) {
                alert('Authentication required. Please set your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesData = async (forceRefresh = false) => {
        try {
            const { data } = await fetchCategories({}, forceRefresh);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    const fetchSubcategoriesData = async (forceRefresh = false) => {
        try {
            const { data } = await fetchSubcategories({}, forceRefresh);
            setSubcategories(data);
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            setSubcategories([]);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProductsData(true);
    };

    const handleRefresh = () => {
        invalidateCache(['products', 'categories', 'subcategories']);
        fetchProductsData(true);
        fetchCategoriesData(true);
        fetchSubcategoriesData(true);
        fetchStats();
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setActiveTab('basic');
        setFormData({
            name: '', slug: '', sku: '', subcategory: '', description: '',
            base_price: '', stock_quantity: 0, is_active: true, discount_type: '',
            discount_value: 0, is_on_sale: false, primary_image: null, zakeke_product_id: '',
        });
        setProductImages([]);
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setActiveTab('basic');
        setFormData({
            name: product.name || '', slug: product.slug || '', sku: product.sku || '',
            subcategory: product.subcategory || '', description: product.description || '',
            base_price: product.base_price || '', stock_quantity: product.stock_quantity || 0,
            is_active: product.is_active ?? true, discount_type: product.discount_type || '',
            discount_value: product.discount_value || 0, is_on_sale: product.is_on_sale || false,
            primary_image: product.primary_image || null, zakeke_product_id: product.zakeke_product_id || '',
        });
        // Load existing images
        const existingImages = [];
        if (product.primary_image) existingImages.push({ url: product.primary_image, filename: 'primary' });
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(img => {
                if (img.image && img.image !== product.primary_image) {
                    existingImages.push({ url: img.image, filename: img.alt_text || 'gallery', id: img.id });
                }
            });
        }
        setProductImages(existingImages);
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Set primary_image from the first uploaded image
            const submitData = { ...formData };
            if (productImages.length > 0) {
                submitData.primary_image = productImages[0].url;
            }
            if (editingProduct) {
                await adminCatalogAPI.patchProduct(editingProduct.id, submitData);
                // Save additional gallery images
                if (productImages.length > 1) {
                    for (let i = 1; i < productImages.length; i++) {
                        const img = productImages[i];
                        if (!img.id) { // Only create new gallery images
                            try {
                                await adminCatalogAPI.createProductImage({
                                    product: editingProduct.id,
                                    image: img.url,
                                    alt_text: img.filename || '',
                                    display_order: i,
                                    is_primary: false,
                                });
                            } catch (imgErr) { console.error('Gallery image save failed:', imgErr); }
                        }
                    }
                }
                alert('Product updated successfully');
            } else {
                await adminCatalogAPI.createProduct(submitData);
                alert('Product created successfully');
            }
            setShowModal(false);
            invalidateCache(['products']);
            fetchProductsData(true);
            // Small delay to ensure DB has committed before re-fetching stats
            setTimeout(() => fetchStats(), 500);
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message));
        }
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await adminCatalogAPI.deleteProduct(productId);
                alert('Product deleted successfully');
                invalidateCache(['products']);
                fetchProductsData(true);
                setTimeout(() => fetchStats(), 500);
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product');
            }
        }
    };

    // --- Filtering ---
    const filteredProducts = products.filter((p) => {
        // Category filter: category dropdown value is a category ID
        // Products belong to subcategories which belong to categories
        // So we need to find all subcategory IDs under the selected category
        if (filterCategory) {
            const catId = String(filterCategory);
            // Get all subcategory IDs that belong to this category
            const subIdsInCategory = subcategories
                .filter(s => String(s.category) === catId)
                .map(s => String(s.id));
            // Check if product's subcategory is in the list
            if (!subIdsInCategory.includes(String(p.subcategory))) {
                return false;
            }
        }
        // Price filters — handle NaN / missing base_price gracefully
        const price = parseFloat(p.base_price);
        const minP = parseFloat(filterMinPrice);
        const maxP = parseFloat(filterMaxPrice);
        if (!isNaN(minP) && filterMinPrice !== '' && (isNaN(price) || price < minP)) return false;
        if (!isNaN(maxP) && filterMaxPrice !== '' && (isNaN(price) || price > maxP)) return false;
        return true;
    });

    // --- Pagination ---
    const totalFiltered = filteredProducts.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const clearFilters = () => {
        setFilterCategory('');
        setFilterMinPrice('');
        setFilterMaxPrice('');
        setCurrentPage(1);
    };

    const STAT_CARDS = [
        { label: 'Total Products', value: stats.total, icon: Package, colorClass: 'psc-teal' },
        { label: 'In Stock Products', value: stats.in_stock, icon: CheckCircle, colorClass: 'psc-green' },
        { label: 'Out of Stock', value: stats.out_of_stock, icon: XCircle, colorClass: 'psc-red' },
        { label: 'Categories', value: stats.categories_count, icon: Grid3X3, colorClass: 'psc-blue' },
    ];

    if (loading) {
        return (
            <div className="prod-loading-wrap">
                <div className="prod-spinner" />
                <span>Loading products...</span>
            </div>
        );
    }

    return (
        <div className="prod-page">
            {/* ---- Header ---- */}
            <div className="prod-header">
                <div className="prod-header-left">
                    <h1>Manage Products</h1>
                    <p className="prod-subtitle">View, search and manage your product inventory</p>
                </div>
                <div className="prod-header-right">
                    <button className="prod-btn-refresh" onClick={handleRefresh} title="Refresh Data">
                        <RefreshCw size={16} />
                    </button>
                    <button className="prod-btn-add" onClick={openCreateModal}>
                        <Plus size={18} /> Add New Product
                    </button>
                </div>
            </div>

            {/* ---- Stat Cards ---- */}
            <div className="prod-stats-grid">
                {STAT_CARDS.map((card) => (
                    <div className={`prod-stat-card ${card.colorClass}`} key={card.label}>
                        <div className="psc-icon-wrap">
                            <card.icon size={22} />
                        </div>
                        <div className="psc-info">
                            <span className="psc-value">{card.value?.toLocaleString() ?? 0}</span>
                            <span className="psc-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ---- Filters Bar ---- */}
            <div className="prod-filters-bar">
                <form className="prod-search-form" onSubmit={handleSearch}>
                    <div className="prod-search-input-wrap">
                        <Search size={16} className="prod-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </form>

                <div className="prod-filter-group">
                    <Filter size={15} />
                    <select
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="prod-filter-group">
                    <input
                        type="number"
                        placeholder="Min Price"
                        value={filterMinPrice}
                        onChange={(e) => { setFilterMinPrice(e.target.value); setCurrentPage(1); }}
                        className="prod-price-input"
                    />
                    <span className="prod-price-sep">—</span>
                    <input
                        type="number"
                        placeholder="Max Price"
                        value={filterMaxPrice}
                        onChange={(e) => { setFilterMaxPrice(e.target.value); setCurrentPage(1); }}
                        className="prod-price-input"
                    />
                </div>

                {(filterCategory || filterMinPrice || filterMaxPrice) && (
                    <button className="prod-clear-filters" onClick={clearFilters}>
                        <X size={14} /> Clear
                    </button>
                )}
            </div>

            {/* ---- Products Table ---- */}
            <div className="prod-table-card">
                <table className="prod-table">
                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="prod-empty-row">
                                    <Package size={40} strokeWidth={1} />
                                    <span>No products found. Try adjusting your filters or add a new product.</span>
                                </td>
                            </tr>
                        ) : (
                            paginatedProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <span className="prod-id-badge">#{product.id}</span>
                                    </td>
                                    <td>
                                        <div className="prod-name-cell">
                                            <div className="prod-img-thumb">
                                                {product.primary_image ? (
                                                    <img src={product.primary_image} alt={product.name} />
                                                ) : (
                                                    <Image size={20} strokeWidth={1.5} />
                                                )}
                                            </div>
                                            <div className="prod-name-wrap">
                                                <span className="prod-name-text">{product.name || 'Untitled'}</span>
                                                <span className="prod-sku-text">SKU: {product.sku || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="prod-cat-badge">{product.subcategory_name || 'Uncategorized'}</span>
                                    </td>
                                    <td>
                                        <span className={`prod-stock-val ${product.is_infinite_stock ? 'infinite' : (product.stock_quantity === 0 ? 'zero' : product.stock_quantity < 10 ? 'low' : 'ok')}`}>
                                            {product.is_infinite_stock ? '∞' : product.stock_quantity ?? 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="prod-price-cell">
                                            {product.is_on_sale && Number(product.final_price) < Number(product.base_price) ? (
                                                <>
                                                    <span className="prod-price-old">₹{Number(product.base_price).toFixed(2)}</span>
                                                    <span className="prod-price-sale">₹{Number(product.final_price).toFixed(2)}</span>
                                                </>
                                            ) : (
                                                <span className="prod-price-main">₹{product.base_price ? Number(product.base_price).toFixed(2) : '0.00'}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`prod-status ${product.is_active ? 'active' : 'inactive'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="prod-actions">
                                            <button className="prod-act-btn edit" onClick={() => openEditModal(product)} title="Edit">
                                                <Pencil size={15} />
                                            </button>
                                            <button className="prod-act-btn delete" onClick={() => handleDelete(product.id)} title="Delete">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ---- Pagination ---- */}
                <div className="prod-pagination">
                    <span className="prod-page-info">
                        Showing {totalFiltered === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + ITEMS_PER_PAGE, totalFiltered)} of {totalFiltered} Products
                    </span>
                    <div className="prod-page-controls">
                        <button className="prod-page-btn" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                            <ChevronLeft size={16} /> Previous
                        </button>
                        {getPageNumbers().map((num) => (
                            <button
                                key={num}
                                className={`prod-page-num ${num === currentPage ? 'active' : ''}`}
                                onClick={() => goToPage(num)}
                            >
                                {num}
                            </button>
                        ))}
                        <button className="prod-page-btn" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ---- Modal ---- */}
            {showModal && (
                <div className="prod-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="prod-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="prod-modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'Create New Product'}</h2>
                            <button onClick={() => setShowModal(false)} className="prod-modal-close">
                                <X size={20} />
                            </button>
                        </div>

                        {editingProduct && (
                            <div className="prod-modal-tabs">
                                <button className={`prod-tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>
                                    Basic Info
                                </button>
                                <button className={`prod-tab ${activeTab === 'attributes' ? 'active' : ''}`} onClick={() => setActiveTab('attributes')}>
                                    Attributes
                                </button>
                                <button className={`prod-tab ${activeTab === 'zakeke' ? 'active' : ''}`} onClick={() => setActiveTab('zakeke')}>
                                    Zakeke Integration
                                </button>
                            </div>
                        )}

                        {activeTab === 'basic' && (
                            <form onSubmit={handleSubmit} className="prod-modal-body">
                                <div className="prod-form-grid">
                                    <div className="prod-form-group">
                                        <label>Product Name <span className="req">*</span></label>
                                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                                    </div>
                                    <div className="prod-form-group">
                                        <label>Slug <span className="req">*</span></label>
                                        <input type="text" name="slug" value={formData.slug} onChange={handleInputChange} required />
                                    </div>
                                    <div className="prod-form-group">
                                        <label>SKU <span className="req">*</span></label>
                                        <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required />
                                    </div>
                                    <div className="prod-form-group">
                                        <label>Subcategory <span className="req">*</span></label>
                                        <select name="subcategory" value={formData.subcategory} onChange={handleInputChange} required>
                                            <option value="">Select Subcategory</option>
                                            {subcategories.length === 0 ? (
                                                <option value="" disabled>No subcategories — create categories first</option>
                                            ) : (
                                                subcategories.map((sub) => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                    <div className="prod-form-group">
                                        <label>Base Price <span className="req">*</span></label>
                                        <input type="number" step="0.01" name="base_price" value={formData.base_price} onChange={handleInputChange} required />
                                    </div>
                                    <div className="prod-form-group">
                                        <label>Stock Quantity</label>
                                        <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleInputChange} />
                                    </div>
                                    <div className="prod-form-group full-width">
                                        <label>Description</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" />
                                    </div>
                                    <div className="prod-form-group">
                                        <label className="prod-checkbox-label">
                                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                                            <span>Active</span>
                                        </label>
                                    </div>
                                </div>

                                {/* ═══ Product Images — Drag & Drop ═══ */}
                                <h4 className="prod-form-section-title">Product Images</h4>
                                <div className="prod-images-section">
                                    <DragDropImageZone
                                        images={productImages}
                                        onImagesChange={setProductImages}
                                        folder="products"
                                    />
                                    <p className="prod-images-hint">First image will be the primary/thumbnail. Drag multiple images to upload at once.</p>
                                </div>

                                <h4 className="prod-form-section-title">Discount Settings</h4>
                                <div className="prod-form-grid">
                                    <div className="prod-form-group">
                                        <label className="prod-checkbox-label">
                                            <input type="checkbox" name="is_on_sale" checked={formData.is_on_sale} onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked })} />
                                            <span>On Sale</span>
                                        </label>
                                    </div>
                                    <div className="prod-form-group">
                                        <label>Discount Type</label>
                                        <select name="discount_type" value={formData.discount_type} onChange={handleInputChange} disabled={!formData.is_on_sale}>
                                            <option value="">No Discount</option>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>
                                    <div className="prod-form-group">
                                        <label>Discount Value</label>
                                        <input type="number" step="0.01" name="discount_value" value={formData.discount_value} onChange={handleInputChange} disabled={!formData.is_on_sale} placeholder={formData.discount_type === 'percentage' ? 'e.g., 20' : 'e.g., 100'} />
                                    </div>
                                </div>

                                <div className="prod-modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="prod-btn-cancel">Cancel</button>
                                    <button type="submit" className="prod-btn-submit">{editingProduct ? 'Update Product' : 'Create Product'}</button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'attributes' && editingProduct && (
                            <ProductAttributesTab productId={editingProduct.id} onClose={() => setShowModal(false)} />
                        )}

                        {activeTab === 'zakeke' && (
                            <ZakekeTab formData={formData} handleInputChange={handleInputChange} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
