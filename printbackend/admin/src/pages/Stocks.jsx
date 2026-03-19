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

const ITEMS_PER_PAGE = 20;

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
    const [currentPage, setCurrentPage] = useState(1);
    const [showInactive, setShowInactive] = useState(true);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            // Auto-paginate: fetch ALL products from the API
            let allProducts = [];
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const res = await adminCatalogAPI.getProducts({ page, page_size: 100 });
                const data = res.data;
                if (Array.isArray(data)) {
                    allProducts = data;
                    hasMore = false;
                } else if (data.results) {
                    allProducts = [...allProducts, ...data.results];
                    hasMore = !!data.next;
                    page++;
                } else {
                    hasMore = false;
                }
            }
            setProducts(allProducts);

            // Also fetch stock alerts
            try {
                const stockRes = await adminStockAPI.getStockAlerts({ threshold });
                setStockData(stockRes.data);
            } catch (e) {
                console.error('Stock alerts fetch error:', e);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (product) => {
        // Infinite stock (POD) products are always in stock
        if (product.is_infinite_stock) return 'in_stock';
        if (product.stock_quantity === 0 || product.stock_quantity === null || product.stock_quantity === undefined) return 'out_of_stock';
        if (product.stock_quantity <= threshold) return 'low_stock';
        return 'in_stock';
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
        if (activeTab === 'Active') matchTab = p.is_active === true;
        if (activeTab === 'Inactive') matchTab = p.is_active === false;

        // If showInactive is off, only show active products
        if (!showInactive && !p.is_active) return false;

        return matchSearch && matchTab;
    });

    // Pagination
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

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab, showInactive]);

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

    // Stats for alert cards (exclude infinite stock items)
    const finiteProducts = products.filter(p => !p.is_infinite_stock);
    const totalProducts = finiteProducts.length;
    const outOfStockCount = finiteProducts.filter(p => p.stock_quantity === 0 || p.stock_quantity === null || p.stock_quantity === undefined).length;
    const lowStockCount = finiteProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= threshold).length;
    const inStockCount = totalProducts - outOfStockCount - lowStockCount;
    const activeCount = products.filter(p => p.is_active).length;
    const inactiveCount = products.filter(p => !p.is_active).length;

    return (
        <div className="stk-page">
            {/* ═══ HEADER ═══ */}
            <h1 className="stk-page-title">Stock and Inventory Management</h1>

            {/* ═══ STOCK ALERT CARDS ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total SKUs</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>{products.length}</div>
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
                <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#0369a1', marginTop: '4px' }}>{activeCount}</div>
                </div>
                <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inactive</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{inactiveCount}</div>
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
                        {['All', 'In Stock', 'Low Stock', 'Out of Stock', 'Active', 'Inactive'].map(tab => (
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
                                <th>ACTIVE</th>
                                <th>STOCK STATUS</th>
                                <th>CURRENT STOCK</th>
                                <th>LOW STOCK ALERT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.length === 0 ? (
                                <tr><td colSpan="7" className="stk-empty">
                                    <Package size={28} strokeWidth={1.2} />
                                    <span>No products found</span>
                                </td></tr>
                            ) : (
                                paginatedProducts.map(product => {
                                    const status = getStockStatus(product);
                                    const cfg = STATUS_BADGE[status];
                                    return (
                                        <tr key={product.id} style={{ opacity: product.is_active ? 1 : 0.6 }}>
                                            <td className="stk-prod-name">{product.name}</td>
                                            <td><code className="stk-sku">{product.sku || '—'}</code></td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    background: product.is_active ? '#dcfce7' : '#f1f5f9',
                                                    color: product.is_active ? '#15803d' : '#94a3b8',
                                                }}>
                                                    {product.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="stk-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
                                                    {product.is_infinite_stock ? '∞ POD' : cfg.label}
                                                </span>
                                            </td>
                                            <td className="stk-stock-val">
                                                {product.is_infinite_stock ? '∞' : (product.stock_quantity?.toLocaleString() ?? 0)} units
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
                        Showing {totalFiltered === 0 ? 0 : startIdx + 1} to {Math.min(startIdx + ITEMS_PER_PAGE, totalFiltered)} of {totalFiltered} products
                    </span>
                    <div className="stk-page-btns">
                        <button className="stk-page-btn" disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>
                            <ChevronLeft size={14} /> Previous
                        </button>
                        {getPageNumbers().map((num) => (
                            <button
                                key={num}
                                className={`stk-page-btn ${num === currentPage ? 'stk-page-active' : ''}`}
                                onClick={() => goToPage(num)}
                                style={num === currentPage ? { background: '#0f172a', color: '#fff', borderColor: '#0f172a' } : {}}
                            >
                                {num}
                            </button>
                        ))}
                        <button className="stk-page-btn" disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>
                            Next <ChevronRight size={14} />
                        </button>
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
