import React, { useState, useEffect } from 'react';
import { adminCatalogAPI } from '../services/api';

const ProductAttributesTab = ({ productId, onClose }) => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAttr, setEditingAttr] = useState(null);
    const [showAttrForm, setShowAttrForm] = useState(false);

    const [attrForm, setAttrForm] = useState({
        name: '',
        display_name: '',
        attribute_type: 'text',
        is_required: true,
        values: []
    });

    const [valueForm, setValueForm] = useState({
        value: '',
        display_value: '',
        price_adjustment: 0,
        is_default: false
    });

    useEffect(() => {
        if (productId) {
            fetchAttributes();
        }
    }, [productId]);

    const fetchAttributes = async () => {
        try {
            setLoading(true);
            const response = await adminCatalogAPI.getAttributes({ product: productId });
            setAttributes(response.data || []);
        } catch (error) {
            console.error('Error fetching attributes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddValue = () => {
        if (!valueForm.value) {
            alert('Value is required');
            return;
        }

        setAttrForm({
            ...attrForm,
            values: [...attrForm.values, { ...valueForm, id: Date.now() }]
        });

        setValueForm({
            value: '',
            display_value: '',
            price_adjustment: 0,
            is_default: false
        });
    };

    const handleRemoveValue = (index) => {
        setAttrForm({
            ...attrForm,
            values: attrForm.values.filter((_, i) => i !== index)
        });
    };

    const handleSaveAttribute = async () => {
        try {
            if (!attrForm.name) {
                alert('Attribute name is required');
                return;
            }

            if (attrForm.values.length === 0) {
                alert('At least one value is required');
                return;
            }

            const data = {
                ...attrForm,
                product: productId,
            };

            if (editingAttr) {
                await adminCatalogAPI.updateAttribute(editingAttr.id, data);
            } else {
                await adminCatalogAPI.createAttribute(data);
            }

            alert('Attribute saved successfully');
            setShowAttrForm(false);
            setEditingAttr(null);
            setAttrForm({
                name: '',
                display_name: '',
                attribute_type: 'text',
                is_required: true,
                values: []
            });
            fetchAttributes();
        } catch (error) {
            console.error('Error saving attribute:', error);
            alert('Failed to save attribute: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleEditAttribute = (attr) => {
        setEditingAttr(attr);
        setAttrForm({
            name: attr.name,
            display_name: attr.display_name || '',
            attribute_type: attr.attribute_type,
            is_required: attr.is_required,
            values: attr.values || []
        });
        setShowAttrForm(true);
    };

    const handleDeleteAttribute = async (attrId) => {
        if (window.confirm('Delete this attribute?')) {
            try {
                await adminCatalogAPI.deleteAttribute(attrId);
                fetchAttributes();
            } catch (error) {
                console.error('Error deleting attribute:', error);
                alert('Failed to delete attribute');
            }
        }
    };

    if (loading) return <div>Loading attributes...</div>;

    return (
        <div className="attributes-tab">
            <div className="tab-header">
                <h3>Product Attributes</h3>
                <button onClick={() => setShowAttrForm(true)} className="btn-primary">
                    + Add Attribute
                </button>
            </div>

            {attributes.length === 0 && !showAttrForm ? (
                <div className="empty-state">
                    <p>No attributes defined for this product.</p>
                    <p>Click "+ Add Attribute" to create one.</p>
                </div>
            ) : (
                <div className="attributes-list">
                    {attributes.map((attr) => (
                        <div key={attr.id} className="attribute-card">
                            <div className="attr-header">
                                <div>
                                    <h4>{attr.display_name || attr.name}</h4>
                                    <span className="attr-type">{attr.attribute_type}</span>
                                    {attr.is_required && <span className="badge-required">Required</span>}
                                </div>
                                <div className="attr-actions">
                                    <button onClick={() => handleEditAttribute(attr)} className="btn-edit-small">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteAttribute(attr.id)} className="btn-delete-small">
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <div className="attr-values">
                                {attr.values && attr.values.map((val) => (
                                    <div key={val.id} className="value-chip">
                                        {val.display_value || val.value}
                                        {val.price_adjustment !== 0 && (
                                            <span className="price-adjust">+₹{val.price_adjustment}</span>
                                        )}
                                        {val.is_default && <span className="badge-default">Default</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAttrForm && (
                <div className="attr-form-modal">
                    <div className="form-header">
                        <h3>{editingAttr ? 'Edit Attribute' : 'Add Attribute'}</h3>
                        <button onClick={() => { setShowAttrForm(false); setEditingAttr(null); }} className="btn-close">×</button>
                    </div>

                    <div className="form-body">
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={attrForm.name}
                                onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })}
                                placeholder="e.g., Size, Material, Color"
                            />
                        </div>

                        <div className="form-group">
                            <label>Display Name</label>
                            <input
                                type="text"
                                value={attrForm.display_name}
                                onChange={(e) => setAttrForm({ ...attrForm, display_name: e.target.value })}
                                placeholder="Optional custom display name"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={attrForm.attribute_type}
                                    onChange={(e) => setAttrForm({ ...attrForm, attribute_type: e.target.value })}
                                >
                                    <option value="text">Text</option>
                                    <option value="color">Color</option>
                                    <option value="image">Image</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={attrForm.is_required}
                                        onChange={(e) => setAttrForm({ ...attrForm, is_required: e.target.checked })}
                                    />
                                    <span>Required</span>
                                </label>
                            </div>
                        </div>

                        <hr />

                        <h4>Attribute Values</h4>
                        <div className="values-section">
                            <div className="value-form">
                                <input
                                    type="text"
                                    placeholder="Value (e.g., Small, Medium)"
                                    value={valueForm.value}
                                    onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })}
                                />
                                <input
                                    type="text"
                                    placeholder="Display Value (optional)"
                                    value={valueForm.display_value}
                                    onChange={(e) => setValueForm({ ...valueForm, display_value: e.target.value })}
                                />
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price Adjustment"
                                    value={valueForm.price_adjustment}
                                    onChange={(e) => setValueForm({ ...valueForm, price_adjustment: parseFloat(e.target.value) || 0 })}
                                />
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={valueForm.is_default}
                                        onChange={(e) => setValueForm({ ...valueForm, is_default: e.target.checked })}
                                    />
                                    <span>Default</span>
                                </label>
                                <button type="button" onClick={handleAddValue} className="btn-secondary">
                                    Add Value
                                </button>
                            </div>

                            <div className="values-list">
                                {attrForm.values.map((val, index) => (
                                    <div key={val.id || index} className="value-item">
                                        <span>{val.display_value || val.value}</span>
                                        {val.price_adjustment !== 0 && <span className="price">+₹{val.price_adjustment}</span>}
                                        {val.is_default && <span className="badge">Default</span>}
                                        <button onClick={() => handleRemoveValue(index)} className="btn-remove">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button onClick={() => { setShowAttrForm(false); setEditingAttr(null); }} className="btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleSaveAttribute} className="btn-primary">
                            {editingAttr ? 'Update' : 'Create'} Attribute
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductAttributesTab;
