import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Plus, Package, ArrowUp, ArrowDown,
    AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { adminStockAPI, adminCatalogAPI } from '../services/api';
import './Stocks.css';

const STATUS_BADGE = {
    in_stock:     { label: 'In Stock',     bg: '#dcfce7', color: '#15803d' },
    low_stock:    { label: 'Low Stock',    bg: '#fef3c7', color: '#92400e' },
    out_of_stock: { label: 'Out of Stock', bg: '#fee2e2', color: '#991b1b' },
};

const Stocks = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [threshold, setThreshold] = useState(10);
    const [editingStock, setEditingStock] = useState({});
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [stockRes, productsRes] = await Promise.all([
                adminStockAPI.getStockAlerts({ threshold }),
                adminCatalogAPI.getProducts({ page_size: 100 }),
            ]);
            setStockData(stockRes.data);
            const prodData = productsRes.data;
            setProducts(Array.isArray(prodData) ? prodData : (prodData.results || []));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (product) => {
        // Infinite stock (POD) products are always in stock
        if (product.is_infinite_stock) return 'in_stock';
        if (product.stock_quantity === 0) return 'out_of_stock';
        if (product.stock_quantity <= threshold) return 'low_stock';
        return 'in_stock';
    };

    const getMovement = (product) => {
        // Mock movement data (would come from backend in production)
        const movements = ['+100', '-50', '+200', '-20', '+50', '-10'];
        const idx = product.id % movements.length;
        return movements[idx];
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = !searchTerm ||
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku?.toLowerCase().includes(searchTerm.toLowerCase());

        const status = getStockStatus(p);
        let matchTab = true;
        if (activeTab === 'In Stock') matchTab = status === 'in_stock';
        if (activeTab === 'Low Stock') matchTab = status === 'low_stock';
        if (activeTab === 'Out of Stock') matchTab = status === 'out_of_stock';

        return matchSearch && matchTab;
    });

    const handleStockChange = (productId, value) => {
        setEditingStock(prev => ({ ...prev, [productId]: parseInt(value) || 0 }));
    };

    const handleBulkUpdate = async () => {
        const updates = Object.entries(editingStock).map(([id, stock_quantity]) => ({
            id: parseInt(id), stock_quantity,
        }));
        if (updates.length === 0) return;
        try {
            await adminStockAPI.bulkUpdateStock(updates);
            setEditingStock({});
            setShowBulkModal(false);
            fetchAll();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.detail || error.message));
        }
    };

    if (loading) {
        return <div className="stk-loading"><div className="stk-spinner"></div><p>Loading inventory...</p></div>;
    }

    // Stats for alert cards
    const totalProducts = products.filter(p => !p.is_infinite_stock).length;
    const outOfStockCount = products.filter(p => !p.is_infinite_stock && p.stock_quantity === 0).length;
    const lowStockCount = products.filter(p => !p.is_infinite_stock && p.stock_quantity > 0 && p.stock_quantity <= threshold).length;
    const inStockCount = totalProducts - outOfStockCount - lowStockCount;

    return (
        <div className="stk-page">
            {/* ═══ HEADER ═══ */}
            <h1 className="stk-page-title">Stock and Inventory Management</h1>

            {/* ═══ STOCK ALERT CARDS ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total SKUs</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{totalProducts}</div>
                </div>
                <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Stock</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#15803d', marginTop: '4px' }}>{inStockCount}</div>
                </div>
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#92400e', marginTop: '4px' }}>{lowStockCount}</div>
                </div>
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Out of Stock</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#991b1b', marginTop: '4px' }}>{outOfStockCount}</div>
                </div>
            </div>

            <section className="stk-overview">
                <h2 className="stk-heading">Inventory Overview</h2>
                <p className="stk-desc">Manage your product stock levels, track inventory movement, and set low-stock alerts.</p>

                {/* Search + Filters */}
                <div className="stk-toolbar">
                    <div className="stk-search-wrap">
                        <Search size={16} className="stk-search-icon" />
                        <input
                            type="text"
                            placeholder="Search for products"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="stk-search-input"
                        />
                    </div>
                    <div className="stk-tabs">
                        {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(tab => (
                            <button
                                key={tab}
                                className={`stk-tab ${activeTab === tab ? 'stk-tab-active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Low stock alert:</label>
                        <input
                            type="number"
                            min="1"
                            value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value) || 10)}
                            style={{ width: '60px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}
                        />
                        <button
                            onClick={fetchAll}
                            style={{ padding: '6px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Apply
                        </button>
                    </div>
                    <button className="stk-filter-btn"><Filter size={15} /> Filter</button>
                    <button className="stk-add-btn" onClick={() => navigate('/products')}>
                        <Plus size={15} /> Add Product
                    </button>
                </div>

                {/* Inventory Table */}
                <div className="stk-table-wrap">
                    <table className="stk-table">
                        <thead>
                            <tr>
                                <th>PRODUCT NAME</th>
                                <th>SKU</th>
                                <th>STATUS</th>
                                <th>CURRENT STOCK</th>
                                <th>MOVEMENT</th>
                                <th>LOW STOCK ALERT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr><td colSpan="7" className="stk-empty">
                                    <Package size={28} strokeWidth={1.2} />
                                    <span>No products found</span>
                                </td></tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const status = getStockStatus(product);
                                    const cfg = STATUS_BADGE[status];
                                    const movement = getMovement(product);
                                    const movementPositive = movement.startsWith('+');
                                    return (
                                        <tr key={product.id}>
                                            <td className="stk-prod-name">{product.name}</td>
                                            <td><code className="stk-sku">{product.sku || '—'}</code></td>
                                            <td>
                                                <span className="stk-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="stk-stock-val">{product.stock_quantity?.toLocaleString() || 0} units</td>
                                            <td>
                                                <span className={`stk-movement ${movementPositive ? 'stk-mov-up' : 'stk-mov-down'}`}>
                                                    {movement}
                                                </span>
                                            </td>
                                            <td className="stk-alert-val">{threshold} units</td>
                                            <td>
                                                <button
                                                    className="stk-adjust-btn"
                                                    onClick={async () => {
                                                        const newQty = prompt(`New stock quantity for ${product.name}:`, product.stock_quantity);
                                                        if (newQty !== null && newQty !== '') {
                                                            try {
                                                                await adminCatalogAPI.patchProduct(product.id, { stock_quantity: parseInt(newQty) || 0 });
                                                                alert(`Stock updated for ${product.name}`);
                                                                fetchAll();
                                                            } catch (err) {
                                                                alert('Failed to update stock: ' + (err.response?.data?.detail || err.message));
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Adjust
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="stk-pagination">
                    <span className="stk-page-info">
                        Showing 1 to {Math.min(filteredProducts.length, 6)} of {filteredProducts.length} results
                    </span>
                    <div className="stk-page-btns">
                        <button className="stk-page-btn" disabled>Previous</button>
                        <button className="stk-page-btn" disabled={filteredProducts.length <= 6}>Next</button>
                    </div>
                </div>

                {/* Save bar */}
                {Object.keys(editingStock).length > 0 && (
                    <div className="stk-save-bar">
                        <span>{Object.keys(editingStock).length} change(s) pending</span>
                        <button className="stk-save-btn" onClick={() => setShowBulkModal(true)}>
                            Save Changes
                        </button>
                    </div>
                )}
            </section>

            {/* Bulk Update Modal */}
            {showBulkModal && (
                <div className="stk-modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="stk-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirm Stock Update</h2>
                        <p>Updating {Object.keys(editingStock).length} product(s)</p>
                        <div className="stk-modal-actions">
                            <button className="bn-btn-cancel" onClick={() => setShowBulkModal(false)}>Cancel</button>
                            <button className="bn-btn-confirm" onClick={handleBulkUpdate}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stocks;
