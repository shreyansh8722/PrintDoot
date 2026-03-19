import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaSearch, FaPlus, FaChevronRight, FaSignInAlt } from 'react-icons/fa';
import { HiOutlinePaintBrush } from 'react-icons/hi2';
import designService from '../../services/designService';

const MyDesigns = () => {
    const navigate = useNavigate();
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('all');
    const [error, setError] = useState('');
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => { loadDesigns(); }, []);

    const loadDesigns = async () => {
        try {
            setLoading(true);
            
            // Get localStorage designs (works for guests and logged-in users)
            const localDesigns = JSON.parse(localStorage.getItem('zakeke_designs') || '[]');
            
            let backendDesigns = [];
            let userIsGuest = false;
            
            try {
                const data = await designService.getMyDesigns();
                backendDesigns = data;
                
                // User is logged in — sync any local designs to backend
                if (localDesigns.length > 0) {
                    for (const local of localDesigns) {
                        try {
                            await designService.createDesign({
                                product: local.productId,
                                name: `${local.productTitle || 'Custom'} Design`,
                                zakeke_design_id: local.designId,
                                preview_url: local.previewUrl || '',
                                design_json: { zakeke_design_id: local.designId, preview_url: local.previewUrl || '', created_via: 'zakeke_editor' },
                                tags: ['zakeke'],
                            });
                        } catch { /* skip duplicates or errors */ }
                    }
                    // Clear localStorage after sync
                    localStorage.removeItem('zakeke_designs');
                    // Re-fetch backend designs after sync
                    const refreshed = await designService.getMyDesigns();
                    backendDesigns = refreshed;
                }
            } catch {
                // User is not logged in — show local designs only
                userIsGuest = true;
            }
            
            setIsGuest(userIsGuest);
            
            if (userIsGuest && localDesigns.length > 0) {
                // Show local designs for guests
                setDesigns(localDesigns.map((d, idx) => ({
                    id: `local-${idx}`,
                    name: `${d.productTitle || 'Custom'} Design`,
                    preview_url: d.previewUrl || '',
                    zakeke_design_id: d.designId,
                    product: { slug: d.productSlug, name: d.productTitle },
                    tags: ['zakeke'],
                    updated_at: d.createdAt,
                    version: 1,
                    _isLocal: true,
                })));
            } else {
                setDesigns(backendDesigns);
            }
        } catch {
            setError('Failed to load designs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this design?')) return;
        try {
            if (String(id).startsWith('local-')) {
                // Delete from localStorage
                const idx = parseInt(String(id).split('-')[1], 10);
                const localDesigns = JSON.parse(localStorage.getItem('zakeke_designs') || '[]');
                localDesigns.splice(idx, 1);
                localStorage.setItem('zakeke_designs', JSON.stringify(localDesigns));
                await loadDesigns();
            } else {
                await designService.deleteDesign(id);
                await loadDesigns();
            }
        } catch {
            alert('Failed to delete design');
        }
    };

    const handleEdit = (design) => {
        if (design.zakeke_design_id || design.product?.zakeke_product_id) {
            const zakekeProductId = design.product?.zakeke_product_id || design.product?.slug;
            const zakekeDesignId = design.zakeke_design_id || design.design_json?.zakeke_design_id || design.id;
            navigate(`/zakeke-editor/${zakekeProductId}?designId=${zakekeDesignId}`);
        } else {
            navigate(`/editor/${design.id}`);
        }
    };

    // Get unique tags
    const allTags = ['all', ...new Set(designs.flatMap(d => d.tags || []))];

    // Filter
    const filteredDesigns = designs.filter(design => {
        const matchesSearch = !searchTerm ||
            design.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            design.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedTag === 'all' || (design.tags || []).includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    /* ── Loading skeleton ── */
    if (loading) {
        return (
            <div className="bg-white min-h-screen">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="h-8 w-48 bg-gray-100 rounded-lg skeleton-shimmer mb-2" />
                    <div className="h-4 w-64 bg-gray-100 rounded skeleton-shimmer mb-8" />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden">
                                <div className="aspect-square bg-gray-50 skeleton-shimmer" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-100 rounded skeleton-shimmer" />
                                    <div className="h-4 w-1/2 bg-gray-100 rounded skeleton-shimmer" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
                            <HiOutlinePaintBrush className="text-brand text-lg" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Designs</h1>
                            <p className="text-sm text-gray-500">Manage and organize your saved designs</p>
                        </div>
                    </div>
                    <Link
                        to="/view-all"
                        className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors w-fit"
                    >
                        <FaPlus className="text-xs" /> Create New
                    </Link>
                </div>

                {/* ── Guest sign-in banner ── */}
                {isGuest && designs.length > 0 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                        <FaSignInAlt className="text-amber-600 text-lg flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800">Sign in to save your designs permanently</p>
                            <p className="text-xs text-amber-600">Your designs are saved locally. Sign in to sync them to your account.</p>
                        </div>
                        <Link to="/auth/login" className="text-sm font-semibold text-amber-700 bg-amber-100 px-4 py-2 rounded-lg hover:bg-amber-200 transition-colors whitespace-nowrap">
                            Sign In
                        </Link>
                    </div>
                )}

                {/* ── Search ── */}
                <div className="mb-5">
                    <div className="relative max-w-md">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search designs…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/40 transition-all placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* ── Tag pills ── */}
                {allTags.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                                    selectedTag === tag
                                        ? 'bg-brand text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tag === 'all' ? 'All Designs' : tag}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
                )}

                {/* ── Empty state ── */}
                {filteredDesigns.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gray-50 flex items-center justify-center mb-5">
                            <HiOutlinePaintBrush className="text-3xl text-gray-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            {searchTerm || selectedTag !== 'all' ? 'No designs found' : 'No designs yet'}
                        </h2>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                            {searchTerm || selectedTag !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : 'Start creating your first design!'}
                        </p>
                        {!searchTerm && selectedTag === 'all' && (
                            <Link to="/view-all" className="inline-flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-brand/90 transition-colors">
                                Browse Products <FaChevronRight className="text-xs" />
                            </Link>
                        )}
                    </div>
                ) : (
                    /* ── Designs grid ── */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {filteredDesigns.map((design) => (
                            <DesignCard
                                key={design.id}
                                design={design}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


/* ══════════════════════════════════════════════════
   DESIGN CARD
   ══════════════════════════════════════════════════ */
const DesignCard = ({ design, onEdit, onDelete }) => {
    const previewImage = design.preview_url || design.preview_image || design.product?.primary_image || 'https://placehold.co/300x300';
    const productName = design.product?.name || 'Unknown Product';

    return (
        <div className="group rounded-2xl border border-gray-100 bg-white overflow-hidden hover:border-brand/20 hover:shadow-lg transition-all duration-300">
            {/* Image with hover overlay */}
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img
                    src={previewImage}
                    alt={design.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                />
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(design)}
                        className="bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                        <FaEdit className="text-brand" /> Edit
                    </button>
                    <button
                        onClick={() => onDelete(design.id)}
                        className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                        <FaTrash /> Delete
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">{design.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mb-3">{productName}</p>

                {/* Tags */}
                {design.tags && design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {design.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-brand/10 text-brand font-medium px-2 py-0.5 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-gray-100">
                    <span>
                        {new Date(design.updated_at).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric', year: 'numeric'
                        })}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">v{design.version || 1}</span>
                </div>
            </div>
        </div>
    );
};

export default MyDesigns;
