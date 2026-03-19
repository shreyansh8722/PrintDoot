import React, { useState, useEffect } from 'react';
import { adminCatalogAPI, adminUploadAPI } from '../services/api';
import { useDataCache } from '../contexts/DataCacheContext';
import './Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingSubcategory, setEditingSubcategory] = useState(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [uploadingBanner, setUploadingBanner] = useState(null); // category id being uploaded
    const { fetchCategories, fetchSubcategories, invalidateCache } = useDataCache();

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        banner_image: '',
    });

    const [subcategoryForm, setSubcategoryForm] = useState({
        category: '',
        name: '',
        slug: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const [catResult, subResult] = await Promise.all([
                fetchCategories({}, forceRefresh),
                fetchSubcategories({}, forceRefresh),
            ]);
            setCategories(catResult.data);
            setSubcategories(subResult.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCategoryModal = (category = null) => {
        setEditingCategory(category);
        setCategoryForm(
            category
                ? {
                    name: category.name,
                    slug: category.slug,
                    description: category.description || '',
                    is_active: category.is_active,
                    banner_image: category.banner_image || '',
                }
                : { name: '', slug: '', description: '', is_active: true, banner_image: '' }
        );
        setShowCategoryModal(true);
    };

    const openSubcategoryModal = (subcategory = null, categoryId = null) => {
        setEditingSubcategory(subcategory);
        setSelectedCategoryId(categoryId);
        setSubcategoryForm(
            subcategory
                ? {
                    category: subcategory.category,
                    name: subcategory.name,
                    slug: subcategory.slug,
                    description: subcategory.description || '',
                    is_active: subcategory.is_active,
                }
                : { category: categoryId || '', name: '', slug: '', description: '', is_active: true }
        );
        setShowSubcategoryModal(true);
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await adminCatalogAPI.updateCategory(editingCategory.id, categoryForm);
                alert('Category updated successfully');
            } else {
                await adminCatalogAPI.createCategory(categoryForm);
                alert('Category created successfully');
            }
            setShowCategoryModal(false);
            invalidateCache(['categories']);
            fetchData(true);
        } catch (error) {
            console.error('Error saving category:', error);
            const detail = error.response?.data;
            if (detail && typeof detail === 'object') {
                const msgs = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
                alert('Failed to save category:\n' + msgs.join('\n'));
            } else {
                alert('Failed to save category: ' + (error.message || 'Unknown error'));
            }
        }
    };

    const handleSubcategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSubcategory) {
                await adminCatalogAPI.updateSubcategory(editingSubcategory.id, subcategoryForm);
                alert('Subcategory updated successfully');
            } else {
                await adminCatalogAPI.createSubcategory(subcategoryForm);
                alert('Subcategory created successfully');
            }
            setShowSubcategoryModal(false);
            invalidateCache(['subcategories']);
            fetchData(true);
        } catch (error) {
            console.error('Error saving subcategory:', error);
            alert('Failed to save subcategory');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Are you sure? This will also delete all subcategories.')) {
            try {
                await adminCatalogAPI.deleteCategory(categoryId);
                alert('Category deleted successfully');
                invalidateCache(['categories', 'subcategories']);
                fetchData(true);
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Failed to delete category');
            }
        }
    };

    const handleDeleteSubcategory = async (subcategoryId) => {
        if (window.confirm('Are you sure you want to delete this subcategory?')) {
            try {
                await adminCatalogAPI.deleteSubcategory(subcategoryId);
                alert('Subcategory deleted successfully');
                invalidateCache(['subcategories']);
                fetchData(true);
            } catch (error) {
                console.error('Error deleting subcategory:', error);
                alert('Failed to delete subcategory');
            }
        }
    };

    /* ── Banner image upload (directly from category card) ── */
    const handleBannerUpload = async (categoryId, categorySlug, file) => {
        if (!file) return;

        // Validate file type
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large. Maximum size is 10MB.');
            return;
        }

        setUploadingBanner(categoryId);
        try {
            // Upload to S3 in category-specific folder
            const folder = `category-banners/${categorySlug}`;
            const res = await adminUploadAPI.uploadImage(file, folder);
            const url = res.data.url;

            // Save the URL to the category
            await adminCatalogAPI.updateCategory(categoryId, { banner_image: url });

            // Refresh data
            invalidateCache(['categories']);
            await fetchData(true);
            alert('Banner image uploaded successfully!');
        } catch (error) {
            console.error('Banner upload error:', error);
            const errMsg = error.response?.data?.error || error.message || 'Unknown error';
            alert('Failed to upload banner: ' + errMsg);
        } finally {
            setUploadingBanner(null);
        }
    };

    const handleRemoveBanner = async (categoryId) => {
        if (!window.confirm('Remove the banner image for this category?')) return;
        try {
            await adminCatalogAPI.updateCategory(categoryId, { banner_image: '' });
            invalidateCache(['categories']);
            await fetchData(true);
            alert('Banner removed');
        } catch (error) {
            console.error('Error removing banner:', error);
            alert('Failed to remove banner');
        }
    };

    /* ── Banner upload in the modal form ── */
    const handleModalBannerUpload = async (file) => {
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.type)) {
            alert('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File is too large. Maximum size is 10MB.');
            return;
        }
        try {
            const slug = categoryForm.slug || 'new-category';
            const folder = `category-banners/${slug}`;
            const res = await adminUploadAPI.uploadImage(file, folder);
            setCategoryForm({ ...categoryForm, banner_image: res.data.url });
        } catch (error) {
            console.error('Banner upload error:', error);
            alert('Failed to upload image: ' + (error.response?.data?.error || error.message));
        }
    };

    if (loading) {
        return <div className="loading">Loading categories...</div>;
    }

    return (
        <div className="categories-page">
            <div className="page-header">
                <h1>Category Management</h1>
                <div className="header-actions">
                    <button onClick={() => fetchData(true)} className="btn-refresh" title="Refresh Data">
                        🔄 Refresh
                    </button>
                    <button onClick={() => openCategoryModal()} className="btn-primary">
                        + Add Category
                    </button>
                </div>
            </div>

            <div className="categories-tree">
                {categories.map((category) => (
                    <div key={category.id} className="category-card">
                        <div className="category-header">
                            <div className="category-info">
                                <h3>{category.name}</h3>
                                <span className="category-slug">{category.slug}</span>
                                <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                                    {category.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="category-actions">
                                <button onClick={() => openSubcategoryModal(null, category.id)} className="btn-add-sub">
                                    + Add Subcategory
                                </button>
                                <button onClick={() => openCategoryModal(category)} className="btn-edit">
                                    Edit
                                </button>
                                <button onClick={() => handleDeleteCategory(category.id)} className="btn-delete">
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* ── Banner Image Section ── */}
                        <div className="category-banner-section">
                            <div className="banner-label">
                                <span>🖼️ Shop Page Banner</span>
                            </div>
                            {category.banner_image ? (
                                <div className="banner-preview-row">
                                    <img
                                        src={category.banner_image}
                                        alt={`${category.name} banner`}
                                        className="banner-thumbnail"
                                    />
                                    <div className="banner-preview-actions">
                                        <label className="btn-upload-small" style={{ opacity: uploadingBanner === category.id ? 0.5 : 1 }}>
                                            {uploadingBanner === category.id ? '⏳ Uploading...' : '🔄 Replace'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                disabled={uploadingBanner === category.id}
                                                onChange={(e) => handleBannerUpload(category.id, category.slug, e.target.files[0])}
                                            />
                                        </label>
                                        <button onClick={() => handleRemoveBanner(category.id)} className="btn-delete-small">
                                            ✕ Remove
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="banner-upload-area" style={{ opacity: uploadingBanner === category.id ? 0.5 : 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        disabled={uploadingBanner === category.id}
                                        onChange={(e) => handleBannerUpload(category.id, category.slug, e.target.files[0])}
                                    />
                                    {uploadingBanner === category.id
                                        ? '⏳ Uploading to S3...'
                                        : '📁 Click to upload banner image (shows on shop page for this category)'}
                                </label>
                            )}
                        </div>

                        <div className="subcategories-list">
                            {subcategories
                                .filter((sub) => sub.category === category.id)
                                .map((sub) => (
                                    <div key={sub.id} className="subcategory-item">
                                        <div className="subcategory-info">
                                            <span className="subcategory-name">{sub.name}</span>
                                            <span className="subcategory-slug">{sub.slug}</span>
                                            <span className={`status-badge ${sub.is_active ? 'active' : 'inactive'}`}>
                                                {sub.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="subcategory-actions">
                                            <button onClick={() => openSubcategoryModal(sub)} className="btn-edit-small">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteSubcategory(sub.id)} className="btn-delete-small">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="modal-close">
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="modal-body">
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Slug *</label>
                                <input
                                    type="text"
                                    value={categoryForm.slug}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            {/* Banner Image Upload in Modal */}
                            <div className="form-group">
                                <label>Shop Page Banner Image</label>
                                {categoryForm.banner_image ? (
                                    <div className="modal-banner-preview">
                                        <img src={categoryForm.banner_image} alt="Banner preview" />
                                        <div className="modal-banner-actions">
                                            <label className="btn-upload-small">
                                                🔄 Replace
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => handleModalBannerUpload(e.target.files[0])}
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setCategoryForm({ ...categoryForm, banner_image: '' })}
                                                className="btn-delete-small"
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="banner-upload-area">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleModalBannerUpload(e.target.files[0])}
                                        />
                                        📁 Click to upload banner image
                                    </label>
                                )}
                                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                                    This image appears on the shop page when users browse this category. Recommended: 1200×400px.
                                </small>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={categoryForm.is_active}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                    />
                                    <span>Active</span>
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subcategory Modal */}
            {showSubcategoryModal && (
                <div className="modal-overlay" onClick={() => setShowSubcategoryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}</h2>
                            <button onClick={() => setShowSubcategoryModal(false)} className="modal-close">
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubcategorySubmit} className="modal-body">
                            <div className="form-group">
                                <label>Parent Category *</label>
                                <select
                                    value={subcategoryForm.category}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category: e.target.value })}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={subcategoryForm.name}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Slug *</label>
                                <input
                                    type="text"
                                    value={subcategoryForm.slug}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={subcategoryForm.description}
                                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={subcategoryForm.is_active}
                                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, is_active: e.target.checked })}
                                    />
                                    <span>Active</span>
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setShowSubcategoryModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingSubcategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categories;
