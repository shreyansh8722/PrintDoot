import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaTrash, FaSearch, FaImage, FaFileImage, FaDownload } from 'react-icons/fa';
import designService from '../../services/designService';
import ScrollReveal from '../../components/ScrollReveal';
import LottieAnimation from '../../components/LottieAnimation';
import './MyDesigns.css';

const MyAssets = () => {
    const fileInputRef = useRef(null);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [error, setError] = useState('');

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            setLoading(true);
            const data = await designService.getMyAssets();
            setAssets(data);
        } catch (err) {
            console.error('Error loading assets:', err);
            setError('Failed to load assets');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        setError('');

        try {
            const uploadPromises = files.map(file => designService.uploadAsset(file, file.type.startsWith('image/') ? 'image' : 'logo'));
            await Promise.all(uploadPromises);
            await loadAssets();
        } catch (err) {
            console.error('Error uploading assets:', err);
            setError('Failed to upload some files. Please try again.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) {
            return;
        }

        try {
            await designService.deleteAsset(id);
            await loadAssets();
        } catch (err) {
            console.error('Error deleting asset:', err);
            alert('Failed to delete asset');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Filter assets
    const filteredAssets = assets.filter(asset => {
        const matchesSearch = !searchTerm || 
            asset.original_filename?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || asset.type === filterType;
        return matchesSearch && matchesType;
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
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Assets</h1>
                        <p className="text-gray-600">Upload and manage your images and logos</p>
                    </div>
                </ScrollReveal>

                {/* Upload and Search */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-transparent"
                            >
                                <option value="all">All Types</option>
                                <option value="image">Images</option>
                                <option value="logo">Logos</option>
                            </select>
                            <label className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-700 transition-colors flex items-center gap-2 cursor-pointer">
                                <FaUpload />
                                Upload
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </ScrollReveal>

                {uploading && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                        Uploading files... Please wait.
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Assets Grid */}
                {filteredAssets.length === 0 ? (
                    <ScrollReveal direction="fade" delay={0.3}>
                        <div className="text-center py-16">
                            <LottieAnimation type="empty" width={200} height={200} />
                            <h3 className="text-2xl font-semibold text-gray-900 mt-6 mb-2">
                                {searchTerm || filterType !== 'all' ? 'No assets found' : 'No assets yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || filterType !== 'all'
                                    ? 'Try adjusting your search or filters'
                                    : 'Upload your first image or logo'}
                            </p>
                            {!searchTerm && filterType === 'all' && (
                                <label className="inline-block bg-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors cursor-pointer">
                                    <FaUpload className="inline mr-2" />
                                    Upload Assets
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </ScrollReveal>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredAssets.map((asset, index) => (
                            <ScrollReveal key={asset.id} direction="up" delay={0.05 * index}>
                                <AssetCard
                                    asset={asset}
                                    onDelete={handleDelete}
                                    formatFileSize={formatFileSize}
                                />
                            </ScrollReveal>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const AssetCard = ({ asset, onDelete, formatFileSize }) => {
    const imageUrl = asset.file || 'https://placehold.co/200x200';
    const isImage = asset.type === 'image' || asset.mime_type?.startsWith('image/');

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Image */}
            <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {isImage ? (
                    <img
                        src={imageUrl}
                        alt={asset.original_filename || 'Asset'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FaFileImage className="text-4xl text-gray-400" />
                    </div>
                )}
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <a
                        href={imageUrl}
                        download
                        className="bg-white text-gray-900 px-3 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm"
                        title="Download"
                    >
                        <FaDownload />
                    </a>
                    <button
                        onClick={() => onDelete(asset.id)}
                        className="bg-white text-red-600 px-3 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-1 text-sm"
                        title="Delete"
                    >
                        <FaTrash />
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <p className="font-medium text-sm text-gray-900 mb-1 line-clamp-1" title={asset.original_filename}>
                    {asset.original_filename || 'Untitled'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="capitalize">{asset.type}</span>
                    {asset.size_bytes && (
                        <span>{formatFileSize(asset.size_bytes)}</span>
                    )}
                </div>
                {asset.resolution_dpi && (
                    <div className="text-xs text-gray-500 mt-1">
                        {asset.resolution_dpi} DPI
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAssets;
