import React, { useState, useEffect } from 'react';
import { adminStockAPI } from '../services/api';
import './Stocks.css';

const Stocks = () => {
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(10);
    const [editingStock, setEditingStock] = useState({});
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        fetchStockData();
    }, [threshold]);

    const fetchStockData = async () => {
        try {
            setLoading(true);
            const response = await adminStockAPI.getStockAlerts({ threshold });
            setStockData(response.data);
        } catch (error) {
            console.error('Error fetching stock data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStockChange = (productId, value) => {
        setEditingStock(prev => ({ ...prev, [productId]: parseInt(value) || 0 }));
    };

    const handleBulkUpdate = async () => {
        const updates = Object.entries(editingStock).map(([id, stock_quantity]) => ({
            id: parseInt(id),
            stock_quantity,
        }));

        if (updates.length === 0) {
            alert('No stock changes to update');
            return;
        }

        try {
            await adminStockAPI.bulkUpdateStock(updates);
            alert(`Successfully updated ${updates.length} product(s)`);
            setEditingStock({});
            setShowBulkModal(false);
            fetchStockData();
        } catch (error) {
            alert('Error updating stock: ' + (error.response?.data?.detail || error.message));
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    if (loading) {
        return <div className="loading">Loading stock data...</div>;
    }

    return (
        <div className="stocks-page">
            <div className="page-header">
                <h1>Stock Management</h1>
                <div className="header-actions">
                    <div className="threshold-control">
                        <label>Low stock threshold:</label>
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                            className="threshold-input"
                            min="1"
                        />
                    </div>
                    <button onClick={fetchStockData} className="btn-refresh">🔄 Refresh</button>
                    {Object.keys(editingStock).length > 0 && (
                        <button onClick={() => setShowBulkModal(true)} className="btn-primary">
                            💾 Save Changes ({Object.keys(editingStock).length})
                        </button>
                    )}
                </div>
            </div>

            {/* Stock Summary Cards */}
            {stockData && (
                <div className="stock-summary-grid">
                    <div className="stock-card warning">
                        <div className="stock-card-icon">⚠️</div>
                        <div className="stock-card-info">
                            <div className="stock-card-number">{stockData.low_stock_count}</div>
                            <div className="stock-card-label">Low Stock Products</div>
                        </div>
                    </div>
                    <div className="stock-card danger">
                        <div className="stock-card-icon">🚫</div>
                        <div className="stock-card-info">
                            <div className="stock-card-number">{stockData.out_of_stock_count}</div>
                            <div className="stock-card-label">Out of Stock</div>
                        </div>
                    </div>
                    <div className="stock-card info">
                        <div className="stock-card-icon">📦</div>
                        <div className="stock-card-info">
                            <div className="stock-card-number">{stockData.total_stock_items?.toLocaleString()}</div>
                            <div className="stock-card-label">Total Items in Stock</div>
                        </div>
                    </div>
                    <div className="stock-card primary">
                        <div className="stock-card-icon">💰</div>
                        <div className="stock-card-info">
                            <div className="stock-card-number">{formatCurrency(stockData.total_stock_value)}</div>
                            <div className="stock-card-label">Total Stock Value</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Out of Stock Products */}
            {stockData?.out_of_stock?.length > 0 && (
                <div className="stock-section">
                    <h2>🚫 Out of Stock Products</h2>
                    <div className="stock-table-container">
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Stock</th>
                                    <th>Update Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockData.out_of_stock.map(product => (
                                    <tr key={product.id} className="out-of-stock-row">
                                        <td>
                                            <div className="product-name-cell">
                                                {product.primary_image && (
                                                    <img src={product.primary_image} alt="" className="product-thumb" />
                                                )}
                                                <div>
                                                    <strong>{product.name}</strong>
                                                    <br /><code className="sku">{product.sku}</code>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{product.category_name || '—'}</td>
                                        <td><span className="stock-badge out">0</span></td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                className="stock-input"
                                                placeholder="New qty"
                                                value={editingStock[product.id] ?? ''}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Low Stock Products */}
            {stockData?.low_stock?.length > 0 && (
                <div className="stock-section">
                    <h2>⚠️ Low Stock Products (below {threshold} units)</h2>
                    <div className="stock-table-container">
                        <table className="stock-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Category</th>
                                    <th>Subcategory</th>
                                    <th>Price</th>
                                    <th>Current Stock</th>
                                    <th>Update Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockData.low_stock.map(product => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="product-name-cell">
                                                {product.primary_image && (
                                                    <img src={product.primary_image} alt="" className="product-thumb" />
                                                )}
                                                <strong>{product.name}</strong>
                                            </div>
                                        </td>
                                        <td><code className="sku">{product.sku}</code></td>
                                        <td>{product.category_name || '—'}</td>
                                        <td>{product.subcategory_name || '—'}</td>
                                        <td>{formatCurrency(product.base_price)}</td>
                                        <td>
                                            <span className={`stock-badge ${product.stock_quantity === 0 ? 'out' : product.stock_quantity < 5 ? 'critical' : 'low'}`}>
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="0"
                                                className="stock-input"
                                                placeholder="New qty"
                                                value={editingStock[product.id] ?? ''}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {stockData?.low_stock?.length === 0 && stockData?.out_of_stock?.length === 0 && (
                <div className="empty-stock">
                    <div className="empty-icon">✅</div>
                    <h3>All products are well stocked!</h3>
                    <p>No products below the threshold of {threshold} units.</p>
                </div>
            )}

            {/* Bulk Update Confirmation Modal */}
            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Confirm Stock Update</h2>
                            <button className="modal-close" onClick={() => setShowBulkModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <p>You are about to update stock for <strong>{Object.keys(editingStock).length}</strong> product(s):</p>
                            <ul className="update-list">
                                {Object.entries(editingStock).map(([id, qty]) => {
                                    const product = [...(stockData?.low_stock || []), ...(stockData?.out_of_stock || [])].find(p => p.id === parseInt(id));
                                    return (
                                        <li key={id}>
                                            {product?.name || `Product #${id}`}: <strong>{qty} units</strong>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleBulkUpdate}>Confirm Update</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stocks;
