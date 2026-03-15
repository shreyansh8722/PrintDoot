import React from 'react';
import { Star } from 'lucide-react';
import './ReviewCard.css';

const ReviewCard = ({ user, date, rating, comment, reply }) => {
    return (
        <div className="review-card">
            <div className="review-header">
                <div className="reviewer-info">
                    <div className="reviewer-avatar">
                        {/* Initial */}
                        {user.charAt(0)}
                    </div>
                    <div className="reviewer-details">
                        <h4 className="reviewer-name">{user}</h4>
                        <div className="rating-stars">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={`star-icon ${i < rating ? 'filled' : 'empty'}`}
                                    fill={i < rating ? "#FFB400" : "none"}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <span className="review-date">{date}</span>
            </div>

            <p className="review-text">{comment}</p>

            {reply && (
                <div className="review-reply">
                    <div className="reply-header">REPLY FROM PRINTDOOT</div>
                    <p className="reply-text">{reply}</p>
                    <div className="reply-footer">
                        <span className="reply-date">2023-08-11</span>
                        <span className="reply-status">● Addressed</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewCard;
