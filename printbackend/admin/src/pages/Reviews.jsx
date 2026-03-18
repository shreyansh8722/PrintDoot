import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { adminCatalogAPI } from '../services/api';
import './Reviews.css';

const REVIEWS_PER_PAGE = 5;

/* ═══════════════════════════════════════════════════════════════
   Avatar colors — consistent per user initial
   ═══════════════════════════════════════════════════════════════ */
const AVATAR_COLORS = [
    { bg: '#e0f2f1', color: '#00897b' },
    { bg: '#fff3e0', color: '#ef6c00' },
    { bg: '#e8eaf6', color: '#3f51b5' },
    { bg: '#fce4ec', color: '#c62828' },
    { bg: '#f3e5f5', color: '#7b1fa2' },
    { bg: '#e0f7fa', color: '#00838f' },
];
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [replyTexts, setReplyTexts] = useState({});

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await adminCatalogAPI.getProductReviews({ page_size: 100 });
            const data = res.data;
            setReviews(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
            // Fallback demo data
            setReviews([
                {
                    id: 1, user_name: 'Emily Carter', rating: 4, created_at: '2023-08-15',
                    comment: 'Absolutely thrilled with the quality of the prints! The colors are vibrant, and the paper stock is excellent. Will definitely be ordering again.',
                    admin_reply: null,
                },
                {
                    id: 2, user_name: 'David Lee', rating: 3, created_at: '2023-08-10',
                    comment: 'Good quality prints, but there was a slight delay in delivery. Overall, satisfied with the product.',
                    admin_reply: "Hi David, we're sorry to hear about the delay. We've looked into your order and have issued a partial refund for the shipping cost. We appreciate your feedback and hope to serve you better next time!",
                    reply_date: '2023-08-11',
                },
                {
                    id: 3, user_name: 'Sarah Johnson', rating: 5, created_at: '2023-08-05',
                    comment: 'Fantastic service and top-notch prints. The team was very helpful in resolving a minor issue. Highly recommend!',
                    admin_reply: null,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (reviewId) => {
        const text = replyTexts[reviewId];
        if (!text || !text.trim()) return;
        try {
            await adminCatalogAPI.updateProductReview(reviewId, { admin_reply: text.trim() });
            alert('Reply saved successfully!');
            setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
            fetchReviews();
        } catch (err) {
            console.error('Failed to save reply:', err);
            alert('Failed to save reply. Please try again.');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
        try {
            await adminCatalogAPI.deleteProductReview(reviewId);
            alert('Review deleted successfully!');
            fetchReviews();
        } catch (err) {
            console.error('Failed to delete review:', err);
            alert('Failed to delete review. Please try again.');
        }
    };

    // Stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1)
        : '0.0';
    const fiveStarPct = totalReviews > 0
        ? Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100)
        : 0;

    // Pagination
    const totalPages = Math.max(1, Math.ceil(totalReviews / REVIEWS_PER_PAGE));
    const paginatedReviews = reviews.slice(
        (currentPage - 1) * REVIEWS_PER_PAGE,
        currentPage * REVIEWS_PER_PAGE
    );

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, 2, 3);
            if (currentPage > 4) pages.push('...');
            if (currentPage > 3 && currentPage < totalPages - 2) pages.push(currentPage);
            if (currentPage < totalPages - 3) pages.push('...');
            pages.push(totalPages);
        }
        return [...new Set(pages)];
    };

    if (loading) {
        return (
            <div className="rv-loading">
                <div className="rv-spinner"></div>
                <p>Loading reviews...</p>
            </div>
        );
    }

    return (
        <div className="rv-page">
            <h1 className="rv-page-title">Customer Reviews</h1>

            {/* ═══ STAT CARDS ═══ */}
            <div className="rv-stats-grid">
                <div className="rv-stat-card">
                    <span className="rv-stat-label">Average Rating</span>
                    <span className="rv-stat-value">{avgRating}</span>
                </div>
                <div className="rv-stat-card">
                    <span className="rv-stat-label">Total Reviews</span>
                    <span className="rv-stat-value">{totalReviews.toLocaleString()}</span>
                </div>
                <div className="rv-stat-card">
                    <span className="rv-stat-label">5-Star Reviews</span>
                    <span className="rv-stat-value">{fiveStarPct}%</span>
                </div>
            </div>

            {/* ═══ ALL REVIEWS ═══ */}
            <div className="rv-reviews-section">
                <h2 className="rv-section-title">All Reviews</h2>

                <div className="rv-reviews-list">
                    {paginatedReviews.map((review) => {
                        const name = review.user_name || review.user?.full_name || review.user?.username || 'Anonymous';
                        const ac = avatarColor(name);
                        const date = review.created_at
                            ? new Date(review.created_at).toLocaleDateString('en-CA')
                            : '';
                        const hasReply = !!review.admin_reply;

                        return (
                            <div key={review.id} className="rv-review-card">
                                {/* Header */}
                                <div className="rv-review-header">
                                    <div className="rv-reviewer-info">
                                        <div
                                            className="rv-avatar"
                                            style={{ background: ac.bg, color: ac.color }}
                                        >
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="rv-reviewer-name">{name}</h4>
                                            <div className="rv-stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={i < review.rating ? '#f59e0b' : 'none'}
                                                        stroke={i < review.rating ? '#f59e0b' : '#d1d5db'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rv-review-header-right">
                                        <span className="rv-review-date">{date}</span>
                                        <button
                                            className="rv-delete-btn"
                                            onClick={() => handleDeleteReview(review.id)}
                                            title="Delete review"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>

                                {/* Comment */}
                                <p className="rv-review-text">{review.comment || review.review_text || ''}</p>

                                {/* Reply (if exists) */}
                                {hasReply && (
                                    <div className="rv-reply-box">
                                        <div className="rv-reply-header">REPLY FROM PRINTDOOT</div>
                                        <p className="rv-reply-text">{review.admin_reply}</p>
                                        <div className="rv-reply-footer">
                                            <span className="rv-reply-date">
                                                {review.admin_reply_date || review.reply_date || review.updated_at?.split('T')[0] || ''}
                                            </span>
                                            <span className="rv-badge rv-badge-addressed">● Addressed</span>
                                        </div>
                                    </div>
                                )}

                                {/* Reply textarea (if no reply yet) */}
                                {!hasReply && (
                                    <div className="rv-reply-form">
                                        <textarea
                                            className="rv-reply-textarea"
                                            placeholder="Write a reply..."
                                            value={replyTexts[review.id] || ''}
                                            onChange={(e) => setReplyTexts(prev => ({
                                                ...prev,
                                                [review.id]: e.target.value
                                            }))}
                                            rows={2}
                                        />
                                        <div className="rv-reply-form-footer">
                                            <span className="rv-badge rv-badge-pending">● Pending</span>
                                            <button
                                                className="rv-reply-btn"
                                                onClick={() => handleReply(review.id)}
                                            >
                                                Reply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {paginatedReviews.length === 0 && (
                        <div className="rv-empty">No reviews found.</div>
                    )}
                </div>

                {/* ═══ PAGINATION ═══ */}
                {totalPages > 1 && (
                    <div className="rv-pagination">
                        <button
                            className="rv-page-btn rv-page-arrow"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {getPageNumbers().map((page, idx) => (
                            page === '...' ? (
                                <span key={`dots-${idx}`} className="rv-page-dots">...</span>
                            ) : (
                                <button
                                    key={page}
                                    className={`rv-page-btn ${currentPage === page ? 'rv-page-active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            )
                        ))}

                        <button
                            className="rv-page-btn rv-page-arrow"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reviews;
