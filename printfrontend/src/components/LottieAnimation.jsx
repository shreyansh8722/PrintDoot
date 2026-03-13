import React from 'react';
import Lottie from 'lottie-react';

/**
 * LottieAnimation component - Wrapper for Lottie animations
 * @param {Object} props
 * @param {Object|string} props.animationData - Lottie JSON data or URL
 * @param {string} props.type - Predefined animation type: 'loading', 'empty', 'success', 'error', 'search'
 * @param {number} props.width - Animation width
 * @param {number} props.height - Animation height
 * @param {boolean} props.loop - Whether to loop the animation
 * @param {boolean} props.autoplay - Whether to autoplay
 * @param {string} props.className - Additional CSS classes
 */
const LottieAnimation = ({
    animationData = null,
    type = null,
    width = 300,
    height = 300,
    loop = true,
    autoplay = true,
    className = ''
}) => {
    // Simple CSS-based animations as fallback
    // You can replace these with actual Lottie JSON files from lottiefiles.com
    if (animationData) {
        return (
            <div className={`lottie-container ${className}`} style={{ width, height }}>
                <Lottie
                    animationData={animationData}
                    loop={loop}
                    autoplay={autoplay}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        );
    }

    // Type-based CSS animations (fallback until Lottie files are added)
    return (
        <div className={`lottie-placeholder ${className} lottie-type-${type}`} style={{ width, height }}>
            {type === 'loading' && (
                <div className="lottie-spinner">
                    <div className="spinner-circle"></div>
                </div>
            )}
            {type === 'empty' && (
                <div className="lottie-empty">
                    <svg viewBox="0 0 200 200" className="empty-icon">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="2"/>
                        <circle cx="100" cy="100" r="60" fill="none" stroke="#d1d5db" strokeWidth="1" strokeDasharray="5,5"/>
                        <text x="100" y="105" textAnchor="middle" fontSize="48" fill="#9ca3af">?</text>
                    </svg>
                </div>
            )}
            {type === 'search' && (
                <div className="lottie-search">
                    <svg viewBox="0 0 200 200" className="search-icon">
                        <circle cx="85" cy="85" r="60" fill="none" stroke="#00DCE5" strokeWidth="8"/>
                        <line x1="130" y1="130" x2="180" y2="180" stroke="#00DCE5" strokeWidth="8" strokeLinecap="round"/>
                    </svg>
                </div>
            )}
            {!type && (
                <div className="lottie-spinner">
                    <div className="spinner-circle"></div>
                </div>
            )}
        </div>
    );
};

export default LottieAnimation;
