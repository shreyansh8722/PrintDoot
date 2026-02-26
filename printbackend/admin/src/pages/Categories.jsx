import React, { useState, useEffect } from 'react';
import { adminCatalogAPI } from '../services/api';
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
    const { fetchCategories, fetchSubcategories, invalidateCache } = useDataCache();

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
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
                }
                : { name: '', slug: '', description: '', is_active: true }
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
            alert('Failed to save category');
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
