import React, { useState, useEffect } from 'react';
import { adminCatalogAPI } from '../services/api';
import { useDataCache } from '../contexts/DataCacheContext';
import ProductAttributesTab from '../components/ProductAttributesTab';
import ZakekeTab from '../components/ZakekeTab';
import './Products.css';
import '../components/ProductAttributes.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('basic'); // basic, attributes, zakeke
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
    }, []);

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
        fetchProductsData(true); // Force refresh on search
    };

    const handleRefresh = () => {
        invalidateCache(['products', 'categories', 'subcategories']);
        fetchProductsData(true);
        fetchCategoriesData(true);
        fetchSubcategoriesData(true);
    };

    const openCreateModal = () => {
        setEditingProduct(null);
        setActiveTab('basic');
        setFormData({
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
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setActiveTab('basic');
        setFormData({
            name: product.name || '',
            slug: product.slug || '',
            sku: product.sku || '',
            subcategory: product.subcategory || '',
            description: product.description || '',
            base_price: product.base_price || '',
            stock_quantity: product.stock_quantity || 0,
            is_active: product.is_active ?? true,
            discount_type: product.discount_type || '',
            discount_value: product.discount_value || 0,
            is_on_sale: product.is_on_sale || false,
            primary_image: product.primary_image || null,
            zakeke_product_id: product.zakeke_product_id || '',
        });
        setShowModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await adminCatalogAPI.updateProduct(editingProduct.id, formData);
                alert('Product updated successfully');
            } else {
                await adminCatalogAPI.createProduct(formData);
                alert('Product created successfully');
            }
            setShowModal(false);
            invalidateCache(['products']);
            fetchProductsData(true);
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await adminCatalogAPI.deleteProduct(productId);
                alert('Product deleted successfully');
                invalidateCache(['products']);
                fetchProductsData(true);
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading products...</div>;
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <h1>Product Management</h1>
                <div className="header-actions">
                    <form onSubmit={handleSearch} className="search-bar">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit">Search</button>
                    </form>
                    <button onClick={handleRefresh} className="btn-refresh" title="Refresh Data">
                        🔄 Refresh
                    </button>
                    <button onClick={openCreateModal} className="btn-primary">
                        + Add Product
                    </button>
                </div>
            </div>

            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                    No products available. Click "Add Product" to create one.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {product.primary_image && (
                                                <img
                                                    src={product.primary_image}
                                                    alt={product.name}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                />
                                            )}
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{product.name || 'Not Available'}</div>
                                                {product.is_on_sale && (
                                                    <span style={{
                                                        fontSize: '11px',
                                                        background: '#fee2e2',
                                                        color: '#991b1b',
                                                        padding: '2px 6px',
                                                        borderRadius: '3px',
                                                        fontWeight: '600'
                                                    }}>
                                                        ON SALE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td><code>{product.sku || 'N/A'}</code></td>
                                    <td>{product.subcategory_name || 'Not Available'}</td>
                                    <td>
                                        {product.is_on_sale && Number(product.final_price) < Number(product.base_price) ? (
                                            <div>
                                                <span style={{ textDecoration: 'line-through', color: '#6b7280', fontSize: '13px' }}>
                                                    ₹{Number(product.base_price).toFixed(2) || '0.00'}
                                                </span>
                                                <div style={{ color: '#dc2626', fontWeight: '600' }}>
                                                    ₹{product.final_price ? Number(product.final_price).toFixed(2) : '0.00'}
                                                </div>
                                            </div>
                                        ) : (
                                            `₹${product.base_price ? Number(product.base_price).toFixed(2) : '0.00'}`
                                        )}
                                    </td>
                                    <td>{product.stock_quantity ?? 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => openEditModal(product)} className="btn-edit">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="btn-delete">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Edit Product' : 'Create Product'}</h2>
                            <button onClick={() => setShowModal(false)} className="modal-close">
                                ×
                            </button>
                        </div>

                        {/* Tabs - only show for existing products */}
                        {editingProduct && (
                            <div className="modal-tabs">
                                <button
                                    className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('basic')}
                                >
                                    Basic Info
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'attributes' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('attributes')}
                                >
                                    Attributes
                                </button>
                                <button
                                    className={`tab-button ${activeTab === 'zakeke' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('zakeke')}
                                >
                                    Zakeke Integration
                                </button>
                            </div>
                        )}

                        {/* Tab Content */}
                        {activeTab === 'basic' && (
                            <form onSubmit={handleSubmit} className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Slug *</label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>SKU *</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Subcategory *</label>
                                        <select
                                            name="subcategory"
                                            value={formData.subcategory}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Subcategory</option>
                                            {subcategories.length === 0 ? (
                                                <option value="" disabled>No subcategories available - Create categories first</option>
                                            ) : (
                                                subcategories.map((sub) => (
                                                    <option key={sub.id} value={sub.id}>
                                                        {sub.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Base Price *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="base_price"
                                            value={formData.base_price}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Stock Quantity</label>
                                        <input
                                            type="number"
                                            name="stock_quantity"
                                            value={formData.stock_quantity}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            />
                                            <span>Active</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Discount Section */}
                                <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Discount Settings</h4>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="is_on_sale"
                                                checked={formData.is_on_sale}
                                                onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked })}
                                            />
                                            <span>On Sale</span>
                                        </label>
                                    </div>

                                    <div className="form-group">
                                        <label>Discount Type</label>
                                        <select
                                            name="discount_type"
                                            value={formData.discount_type}
                                            onChange={handleInputChange}
                                            disabled={!formData.is_on_sale}
                                        >
                                            <option value="">No Discount</option>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Discount Value</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="discount_value"
                                            value={formData.discount_value}
                                            onChange={handleInputChange}
                                            disabled={!formData.is_on_sale}
                                            placeholder={formData.discount_type === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Primary Image URL</label>
                                        <input
                                            type="url"
                                            name="primary_image"
                                            value={formData.primary_image || ''}
                                            onChange={handleInputChange}
                                            placeholder="https://your-s3-bucket.com/image.jpg"
                                        />
                                        {formData.primary_image && (
                                            <img
                                                src={formData.primary_image}
                                                alt="Preview"
                                                style={{ maxWidth: '100px', marginTop: '8px', borderRadius: '4px' }}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingProduct ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Attributes Tab */}
                        {activeTab === 'attributes' && editingProduct && (
                            <ProductAttributesTab
                                productId={editingProduct.id}
                                onClose={() => setShowModal(false)}
                            />
                        )}

                        {/* Zakeke Tab */}
                        {activeTab === 'zakeke' && (
                            <ZakekeTab
                                formData={formData}
                                handleInputChange={handleInputChange}
                            />
                        )}


                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
