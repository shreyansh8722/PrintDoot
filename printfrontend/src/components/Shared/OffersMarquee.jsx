import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import offerService from '../../services/offerService';
import './OffersMarquee.css';

const OffersMarquee = () => {
    const [offers, setOffers] = useState([]);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const data = await offerService.getOffers();
                // Use API data; fall back to defaults if empty
                if (data && data.length > 0) {
                    setOffers(data);
                } else {
                    setOffers([
                        { id: 1, icon: '🔥', text: 'Flat 20% Off on All T-Shirts' },
                        { id: 2, icon: '🚚', text: 'Free Shipping on Orders Above ₹999' },
                        { id: 3, icon: '☕', text: 'Buy 2 Get 1 Free on Mugs' },
                        { id: 4, icon: '🎉', text: 'New Users Get Extra 10% Off' },
                        { id: 5, icon: '✨', text: 'Premium Quality Prints' },
                        { id: 6, icon: '🎨', text: 'Customize Any Product in Minutes' },
                    ]);
                }
            } catch {
                // Fallback offers if API fails
                setOffers([
                    { id: 1, icon: '🔥', text: 'Flat 20% Off on All T-Shirts' },
                    { id: 2, icon: '🚚', text: 'Free Shipping on Orders Above ₹999' },
                    { id: 3, icon: '☕', text: 'Buy 2 Get 1 Free on Mugs' },
                    { id: 4, icon: '🎉', text: 'New Users Get Extra 10% Off' },
                ]);
            }
        };
        fetchOffers();
    }, []);

    if (offers.length === 0) return null;

    // Duplicate the list for seamless infinite scroll
    const marqueeItems = [...offers, ...offers];

    const renderItem = (offer, idx) => {
        const content = (
            <span className="marquee-offer-item" key={idx}>
                <span className="marquee-offer-icon">{offer.icon}</span>
                <span className="marquee-offer-text">{offer.text}</span>
                <span className="marquee-separator">✦</span>
            </span>
        );

        if (offer.link) {
            return (
                <Link to={offer.link} key={idx} className="marquee-offer-link">
                    {content}
                </Link>
            );
        }

        return content;
    };

    return (
        <div className="offers-marquee-wrapper">
            <div className="offers-marquee-track">
                <div className="offers-marquee-content">
                    {marqueeItems.map((offer, idx) => renderItem(offer, idx))}
                </div>
                {/* Duplicate for seamless loop */}
                <div className="offers-marquee-content" aria-hidden="true">
                    {marqueeItems.map((offer, idx) => renderItem(offer, idx + marqueeItems.length))}
                </div>
            </div>
        </div>
    );
};

export default OffersMarquee;
