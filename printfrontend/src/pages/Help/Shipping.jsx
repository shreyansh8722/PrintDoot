import React from 'react';
import { FaTruck, FaMapMarkerAlt, FaClock, FaBox, FaShippingFast, FaCheckCircle } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import './Help.css';

const Shipping = () => {
    const shippingMethods = [
        {
            name: 'Standard Shipping',
            duration: '5-7 business days',
            cost: 'Free on orders above ₹500',
            description: 'Regular shipping with tracking. Delivery times may vary based on location.',
            icon: <FaTruck />
        },
        {
            name: 'Express Shipping',
            duration: '2-3 business days',
            cost: '₹150 - ₹300',
            description: 'Priority handling and faster delivery. Available for most products.',
            icon: <FaShippingFast />
        },
        {
            name: 'Same Day Delivery',
            duration: 'Same day (selected areas)',
            cost: '₹300 - ₹500',
            description: 'Available in select metro cities. Order before 12 PM for same-day delivery.',
            icon: <FaBox />
        }
    ];

    const shippingTimeline = [
        { phase: 'Order Placed', duration: 'Immediate', description: 'Your order is confirmed and payment is processed' },
        { phase: 'Production', duration: '2-3 days', description: 'Your items are being printed and prepared' },
        { phase: 'Quality Check', duration: '1 day', description: 'Items are checked for quality and packaging' },
        { phase: 'Shipped', duration: 'Varies', description: 'Items are dispatched and tracking information is sent' },
        { phase: 'In Transit', duration: '2-5 days', description: 'Items are on the way to your address' },
        { phase: 'Delivered', duration: '-', description: 'Items are delivered to your address' }
    ];

    return (
        <div className="help-page">
            <div className="help-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="help-hero">
                        <div className="hero-icon">
                            <FaTruck />
                        </div>
                        <h1>Shipping & Delivery</h1>
                        <p>Fast and reliable shipping across India</p>
                    </div>
                </ScrollReveal>

                {/* Shipping Methods */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="shipping-methods-section">
                        <h2>Shipping Options</h2>
                        <p className="section-intro">
                            Choose the shipping method that works best for you. All orders include tracking information.
                        </p>
                        <div className="shipping-methods-grid">
                            {shippingMethods.map((method, index) => (
                                <ScrollReveal key={method.name} direction="up" delay={0.1 + index * 0.1}>
                                    <div className="shipping-method-card">
                                        <div className="method-icon">{method.icon}</div>
                                        <h3>{method.name}</h3>
                                        <div className="method-duration">
                                            <FaClock />
                                            <span>{method.duration}</span>
                                        </div>
                                        <div className="method-cost">
                                            <span>{method.cost}</span>
                                        </div>
                                        <p className="method-description">{method.description}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>

                {/* Shipping Timeline */}
                <ScrollReveal direction="up" delay={0.3}>
                    <div className="timeline-section">
                        <h2>Shipping Timeline</h2>
                        <p className="section-intro">
                            Here's what happens after you place an order:
                        </p>
                        <div className="shipping-timeline">
                            {shippingTimeline.map((item, index) => (
                                <ScrollReveal key={item.phase} direction="left" delay={0.1 + index * 0.1}>
                                    <div className="timeline-item">
                                        <div className="timeline-marker-number">{index + 1}</div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <h4>{item.phase}</h4>
                                                {item.duration !== '-' && (
                                                    <span className="timeline-duration">{item.duration}</span>
                                                )}
                                            </div>
                                            <p>{item.description}</p>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>

                {/* Important Information */}
                <div className="shipping-info-grid">
                    <ScrollReveal direction="left" delay={0.4}>
                        <div className="info-card">
                            <div className="info-icon">
                                <FaMapMarkerAlt />
                            </div>
                            <h3>Delivery Areas</h3>
                            <p>
                                We ship to all major cities and towns across India. Remote locations may take 
                                additional 2-3 days. Delivery to P.O. Boxes is not available.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={0.5}>
                        <div className="info-card">
                            <div className="info-icon">
                                <FaClock />
                            </div>
                            <h3>Processing Time</h3>
                            <p>
                                Most orders are processed within 1-2 business days. Custom products may take 
                                3-5 business days. You'll receive an email when your order ships.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="right" delay={0.4}>
                        <div className="info-card">
                            <div className="info-icon">
                                <FaCheckCircle />
                            </div>
                            <h3>Tracking Your Order</h3>
                            <p>
                                Once shipped, you'll receive a tracking number via email and SMS. Track your 
                                order in real-time from our tracking page or your order details.
                            </p>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Additional Information */}
                <ScrollReveal direction="up" delay={0.6}>
                    <div className="additional-info">
                        <h2>Additional Information</h2>
                        <div className="info-list">
                            <div className="info-list-item">
                                <FaCheckCircle />
                                <div>
                                    <h4>Free Shipping</h4>
                                    <p>Free standard shipping on all orders above ₹500. Shipping charges apply for orders below ₹500.</p>
                                </div>
                            </div>
                            <div className="info-list-item">
                                <FaCheckCircle />
                                <div>
                                    <h4>Multiple Items</h4>
                                    <p>If your order contains multiple items, they may ship separately based on availability and production time.</p>
                                </div>
                            </div>
                            <div className="info-list-item">
                                <FaCheckCircle />
                                <div>
                                    <h4>Address Changes</h4>
                                    <p>You can change your delivery address within 2 hours of placing your order. After that, contact support immediately.</p>
                                </div>
                            </div>
                            <div className="info-list-item">
                                <FaCheckCircle />
                                <div>
                                    <h4>Delivery Issues</h4>
                                    <p>If you experience any delivery issues, contact our support team immediately. We'll work with the carrier to resolve the issue.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Need Help */}
                <ScrollReveal direction="up" delay={0.7}>
                    <div className="help-cta">
                        <h3>Have Questions About Shipping?</h3>
                        <p>Our team is ready to help you with any shipping-related questions.</p>
                        <div className="cta-buttons">
                            <a href="/contact" className="btn-primary">
                                Contact Support
                            </a>
                            <a href="/track-order" className="btn-secondary">
                                Track Your Order
                            </a>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default Shipping;
