import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaSearch, FaImage, FaPlus, FaTags } from 'react-icons/fa';
import designService from '../../services/designService';
import ScrollReveal from '../../components/ScrollReveal';
import LottieAnimation from '../../components/LottieAnimation';
import './MyDesigns.css';

const MyDesigns = () => {
    const navigate = useNavigate();
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('all');
    const [error, setError] = useState('');

    useEffect(() => {
        loadDesigns();
    }, []);

    const loadDesigns = async () => {
        try {
            setLoading(true);
            const data = await designService.getMyDesigns();
            setDesigns(data);
        } catch (err) {
            console.error('Error loading designs:', err);
            setError('Failed to load designs');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this design?')) {
            return;
        }

        try {
            await designService.deleteDesign(id);
            await loadDesigns();
        } catch (err) {
            console.error('Error deleting design:', err);
            alert('Failed to delete design');
        }
    };

    const handleEdit = (design) => {
        // Navigate to editor with design data
        if (design.product?.zakeke_product_id) {
            navigate(`/zakeke-editor/${design.product.zakeke_product_id}?designId=${design.id}`);
        } else {
            navigate(`/editor/${design.id}`);
        }
    };

    // Get unique tags from all designs
    const allTags = ['all', ...new Set(designs.flatMap(d => d.tags || []))];

    // Filter designs
    const filteredDesigns = designs.filter(design => {
        const matchesSearch = !searchTerm || 
            design.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            design.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTag = selectedTag === 'all' || (design.tags || []).includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    if (loading) {
        return (
            <div className="my-designs-page">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex justify-center items-center h-96">
                        <LottieAnimation type="loading" width={150} height={150} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-designs-page bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Designs</h1>
                        <p className="text-gray-600">Manage and organize your saved designs</p>
                    </div>
                </ScrollReveal>

                {/* Search and Filters */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search designs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            />
                        </div>
                        <Link
                            to="/view-all"
                            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center gap-2"
                        >
                            <FaPlus />
                            Create New Design
                        </Link>
                    </div>
                </ScrollReveal>

                {/* Tags Filter */}
                {allTags.length > 1 && (
                    <ScrollReveal direction="up" delay={0.3}>
                        <div className="mb-6 flex flex-wrap gap-2">
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(tag)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        selectedTag === tag
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {tag === 'all' ? 'All Designs' : tag}
                                </button>
                            ))}
                        </div>
                    </ScrollReveal>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Designs Grid */}
                {filteredDesigns.length === 0 ? (
                    <ScrollReveal direction="fade" delay={0.3}>
                        <div className="text-center py-16">
                            <LottieAnimation type="empty" width={200} height={200} />
                            <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-2">
                                {searchTerm || selectedTag !== 'all' ? 'No designs found' : 'No designs yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || selectedTag !== 'all' 
                                    ? 'Try adjusting your search or filters'
                                    : 'Start creating your first design'}
                            </p>
                            {!searchTerm && selectedTag === 'all' && (
                                <Link
                                    to="/view-all"
                                    className="inline-block bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                                >
                                    Browse Products
                                </Link>
                            )}
                        </div>
                    </ScrollReveal>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDesigns.map((design, index) => (
                            <ScrollReveal key={design.id} direction="up" delay={0.05 * index}>
                                <DesignCard
                                    design={design}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </ScrollReveal>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const DesignCard = ({ design, onEdit, onDelete }) => {
    const previewImage = design.preview_image || design.product?.primary_image || 'https://placehold.co/300x300';
    const productName = design.product?.name || 'Unknown Product';

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Image */}
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img
                    src={previewImage}
                    alt={design.name}
                    className="w-full h-full object-contain p-2"
                />
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                        onClick={() => onEdit(design)}
                        className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <FaEdit />
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(design.id)}
                        className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                        <FaTrash />
                        Delete
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{design.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">{productName}</p>
                
                {/* Tags */}
                {design.tags && design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {design.tags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={idx}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <span>
                        Updated {new Date(design.updated_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </span>
                    <span>v{design.version || 1}</span>
                </div>
            </div>
        </div>
    );
};

export default MyDesigns;
