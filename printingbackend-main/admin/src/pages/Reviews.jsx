import React from 'react';
import StatCard from '../components/StatCard';
import ReviewCard from '../components/ReviewCard';
import './Reviews.css';

const Reviews = () => {
    const reviews = [
        {
            user: "Emily Carter",
            date: "2023-08-15",
            rating: 4,
            comment: "Absolutely thrilled with the quality of the prints! The colors are vibrant, and the paper stock is excellent. Will definitely be ordering again.",
            reply: null
        },
        {
            user: "David Lee",
            date: "2023-08-10",
            rating: 3,
            comment: "Good quality prints, but there was a slight delay in delivery. Overall, satisfied with the product.",
            reply: "Hi David, we're sorry to hear about the delay. We've looked into your order and have issued a partial refund for the shipping cost. We appreciate your feedback and hope to serve you better next time!"
        }
    ];

    return (
        <div className="reviews-page">
            <h2 className="page-title">Customer Reviews</h2>

            {/* Stats Row */}
            <section className="stats-grid">
                <StatCard title="Average Rating" value="4.6" />
                <StatCard title="Total Reviews" value="1,250" />
                <StatCard title="5-Star Reviews" value="85%" />
            </section>

            {/* All Reviews Section */}
            <section className="reviews-list-section">
                <h3 className="section-title">All Reviews</h3>
                <div className="reviews-container">
                    {reviews.map((r, i) => (
                        <ReviewCard key={i} {...r} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Reviews;
