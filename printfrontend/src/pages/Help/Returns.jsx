import React from 'react';
import { FaUndo, FaBoxOpen, FaClock, FaCheckCircle, FaTimesCircle, FaFileAlt } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import './Help.css';

const Returns = () => {
    const returnSteps = [
        {
            step: 1,
            title: 'Request a Return',
            description: 'Log into your account, go to "My Orders", and select the order you want to return. Click "Request Return" and select the reason.',
            icon: <FaFileAlt />
        },
        {
            step: 2,
            title: 'Get Approval',
            description: 'Our team will review your return request within 24 hours. You\'ll receive an email with approval status and return instructions.',
            icon: <FaCheckCircle />
        },
        {
            step: 3,
            title: 'Package & Ship',
            description: 'Pack the item in its original packaging with all accessories. Use the return shipping label we provide (if applicable) and ship it back.',
            icon: <FaBoxOpen />
        },
        {
            step: 4,
            title: 'Receive Refund',
            description: 'Once we receive and inspect the item, we\'ll process your refund within 5-7 business days to your original payment method.',
            icon: <FaUndo />
        }
    ];

    const eligibleConditions = [
        'Defective or damaged items',
        'Incorrect items received',
        'Printing errors on our part',
        'Items not matching product description'
    ];

    const notEligibleConditions = [
        'Customized products (unless defective)',
        'Items returned after 14 days',
        'Items without original packaging',
        'Items damaged by customer',
        'Used or worn items'
    ];

    return (
        <div className="help-page">
            <div className="help-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="help-hero">
                        <div className="hero-icon">
                            <FaUndo />
                        </div>
                        <h1>Returns & Refunds</h1>
                        <p>Easy returns within 14 days of delivery</p>
                    </div>
                </ScrollReveal>

                {/* Return Policy Overview */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="policy-card">
                        <div className="policy-header">
                            <FaClock />
                            <h2>14-Day Return Policy</h2>
                        </div>
                        <p>
                            We want you to be completely satisfied with your purchase. If you're not happy with your order, 
                            you can return eligible items within 14 days of delivery for a full refund or exchange.
                        </p>
                        <div className="policy-highlights">
                            <div className="highlight-item">
                                <FaCheckCircle className="highlight-icon" />
                                <span>Free returns for defective items</span>
                            </div>
                            <div className="highlight-item">
                                <FaCheckCircle className="highlight-icon" />
                                <span>Fast refund processing (5-7 days)</span>
                            </div>
                            <div className="highlight-item">
                                <FaCheckCircle className="highlight-icon" />
                                <span>Easy online return process</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Return Process */}
                <ScrollReveal direction="up" delay={0.3}>
                    <div className="process-section">
                        <h2>How to Return an Item</h2>
                        <div className="process-steps">
                            {returnSteps.map((step, index) => (
                                <ScrollReveal key={step.step} direction="up" delay={0.1 + index * 0.1}>
                                    <div className="process-step">
                                        <div className="step-number">{step.step}</div>
                                        <div className="step-icon">{step.icon}</div>
                                        <h3>{step.title}</h3>
                                        <p>{step.description}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </ScrollReveal>

                <div className="returns-layout">
                    {/* Eligible for Return */}
                    <ScrollReveal direction="left" delay={0.4}>
                        <div className="eligibility-card eligible">
                            <div className="card-header">
                                <FaCheckCircle className="card-icon" />
                                <h3>Eligible for Return</h3>
                            </div>
                            <ul className="eligibility-list">
                                {eligibleConditions.map((condition, index) => (
                                    <li key={index}>
                                        <FaCheckCircle />
                                        <span>{condition}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ScrollReveal>

                    {/* Not Eligible for Return */}
                    <ScrollReveal direction="right" delay={0.4}>
                        <div className="eligibility-card not-eligible">
                            <div className="card-header">
                                <FaTimesCircle className="card-icon" />
                                <h3>Not Eligible for Return</h3>
                            </div>
                            <ul className="eligibility-list">
                                {notEligibleConditions.map((condition, index) => (
                                    <li key={index}>
                                        <FaTimesCircle />
                                        <span>{condition}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Important Information */}
                <ScrollReveal direction="up" delay={0.5}>
                    <div className="info-section">
                        <h2>Important Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <h4>Return Shipping</h4>
                                <p>
                                    Return shipping is free for defective items or our errors. For other returns, 
                                    you may be responsible for return shipping costs unless otherwise stated.
                                </p>
                            </div>
                            <div className="info-item">
                                <h4>Refund Processing</h4>
                                <p>
                                    Refunds are processed within 5-7 business days after we receive the returned item. 
                                    It may take an additional 3-5 days for the refund to appear in your account.
                                </p>
                            </div>
                            <div className="info-item">
                                <h4>Original Packaging</h4>
                                <p>
                                    Items must be returned in their original packaging with all accessories and tags. 
                                    Items returned without original packaging may be subject to a restocking fee.
                                </p>
                            </div>
                            <div className="info-item">
                                <h4>Exchanges</h4>
                                <p>
                                    We currently don't offer direct exchanges. Please return the item and place a new order 
                                    for the item you'd like instead.
                                </p>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* Need Help */}
                <ScrollReveal direction="up" delay={0.6}>
                    <div className="help-cta">
                        <h3>Need Help with a Return?</h3>
                        <p>Our support team is here to assist you with any return-related questions.</p>
                        <div className="cta-buttons">
                            <a href="/contact" className="btn-primary">
                                Contact Support
                            </a>
                            <a href="/account/orders" className="btn-secondary">
                                View My Orders
                            </a>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default Returns;
