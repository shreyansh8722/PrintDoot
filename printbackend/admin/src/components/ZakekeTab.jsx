import React from 'react';

const ZakekeTab = ({ formData, handleInputChange }) => {
    return (
        <div className="zakeke-tab">
            <div className="tab-description" style={{ marginBottom: '20px', color: '#6b7280', fontSize: '14px' }}>
                <p>Link this product to a Zakeke Customizable Product.</p>
                <p>Enter the <strong>Zakeke Product ID</strong> from your Zakeke Back-office.</p>
            </div>

            <div className="form-group">
                <label>Zakeke Product ID</label>
                <input
                    type="text"
                    name="zakeke_product_id"
                    value={formData.zakeke_product_id || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 123456 or 5938-abcd..."
                    style={{ fontFamily: 'monospace' }}
                />
                <small className="help-text" style={{ display: 'block', marginTop: '6px', color: '#9ca3af' }}>
                    Leave empty to unlink this product from Zakeke.
                </small>
            </div>

            {formData.zakeke_product_id && (
                <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    color: '#166534'
                }}>
                    <strong>✓ Linked to Zakeke</strong>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        This product will launch the Zakeke Customizer on the storefront.
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZakekeTab;
