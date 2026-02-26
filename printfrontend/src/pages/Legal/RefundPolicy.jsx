import React from 'react';
import { FaUndo, FaCheckCircle, FaTimesCircle, FaClock, FaShieldAlt } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import './Legal.css';

const RefundPolicy = () => {
    const eligibleItems = [
        'Defective or damaged products received',
        'Wrong item delivered (different from what was ordered)',
        'Printing errors caused by PrintDoot (misprints, smudges, color discrepancies)',
        'Missing items from your order',
        'Products that do not match the approved proof/preview',
    ];

    const nonEligibleItems = [
        'Customized products where the error is in the customer-submitted design',
        'Products damaged due to misuse, mishandling, or negligence after delivery',
        'Items returned after 14 days of delivery',
        'Products with minor color variations due to screen-to-print differences',
        'Items where the customer approved a digital proof before printing',
        'Gift cards or downloadable digital products',
    ];

    const refundTimeline = [
        {
            step: '1',
            title: 'Submit Return Request',
            description: 'Log into your account → My Orders → Select Order → Request Return. Provide the reason and upload photos if the product is damaged.',
            duration: 'Day 0',
        },
        {
            step: '2',
            title: 'Review & Approval',
            description: 'Our team reviews your request and either approves it or contacts you for more information.',
            duration: '1–2 business days',
        },
        {
            step: '3',
            title: 'Return Pickup / Ship Back',
            description: 'Once approved, we arrange a pickup or provide a return shipping label. Pack the item securely in its original packaging.',
            duration: '2–3 business days',
        },
        {
            step: '4',
            title: 'Inspection & Quality Check',
            description: 'We inspect the returned item to verify the issue. You\'ll receive an email confirmation once inspection is complete.',
            duration: '1–2 business days',
        },
        {
            step: '5',
            title: 'Refund Processed',
            description: 'Refund is initiated to your original payment method. Bank processing may take additional time.',
            duration: '5–7 business days',
        },
    ];

    return (
        <div className="legal-page">
            <div className="legal-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="legal-hero">
                        <div className="hero-icon">
                            <FaUndo />
                        </div>
                        <h1>Refund & Return Policy</h1>
                        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </ScrollReveal>

                {/* Introduction */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="legal-intro">
                        <p>
                            At PrintDoot, customer satisfaction is our top priority. We stand behind the quality of our products 
                            and want you to be completely happy with your purchase. If something isn't right, we're here to help. 
                            Please review our refund and return policy below.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Return Window */}
                <ScrollReveal direction="up" delay={0.3}>
                    <section className="legal-section">
                        <h2>1. Return Window</h2>
                        <p>
                            You may request a return within <strong>14 days</strong> of receiving your order. Returns requested 
                            after 14 days will not be accepted unless the product is defective and the defect was not immediately apparent.
                        </p>
                        <p>
                            To be eligible for a return, items must be in their original condition and packaging, unused, and undamaged 
                            (except for the defect being reported).
                        </p>
                    </section>
                </ScrollReveal>

                {/* Eligible Items */}
                <ScrollReveal direction="up" delay={0.4}>
                    <section className="legal-section">
                        <h2>2. Eligible for Return & Refund</h2>
                        <p>The following situations qualify for a return and/or refund:</p>
                        <ul className="purpose-list">
                            {eligibleItems.map((item, index) => (
                                <li key={index}>
                                    <FaCheckCircle className="list-icon" style={{ color: '#059669' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </ScrollReveal>

                {/* Non-Eligible Items */}
                <ScrollReveal direction="up" delay={0.5}>
                    <section className="legal-section">
                        <h2>3. Not Eligible for Return</h2>
                        <p>The following items/situations are not eligible for return or refund:</p>
                        <ul className="purpose-list">
                            {nonEligibleItems.map((item, index) => (
                                <li key={index}>
                                    <FaTimesCircle className="list-icon" style={{ color: '#ef4444' }} />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </ScrollReveal>

                {/* How to Request a Return */}
                <ScrollReveal direction="up" delay={0.6}>
                    <section className="legal-section">
                        <h2>4. How to Request a Return</h2>
                        <div className="section-content">
                            <p>Follow these steps to initiate a return:</p>
                            <ol className="nested-list" style={{ listStyleType: 'decimal' }}>
                                <li>Log in to your PrintDoot account</li>
                                <li>Navigate to <strong>My Orders</strong> from your dashboard</li>
                                <li>Select the order containing the item(s) you wish to return</li>
                                <li>Click <strong>"Request Return"</strong> and select the affected items</li>
                                <li>Choose the reason for return and provide a description</li>
                                <li>Upload photos of the defective/damaged product (if applicable)</li>
                                <li>Submit your request – you'll receive a confirmation email</li>
                            </ol>
                            <p style={{ marginTop: '1rem' }}>
                                Alternatively, you can contact our support team at <a href="mailto:support@printdoot.com">support@printdoot.com</a> or 
                                call <a href="tel:+912522669393">+91 2522-669393</a>.
                            </p>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Refund Timeline */}
                <ScrollReveal direction="up" delay={0.7}>
                    <section className="legal-section">
                        <h2>5. Refund Process & Timeline</h2>
                        <p>Once your return request is submitted, here's what to expect:</p>
                        <div className="refund-timeline">
                            {refundTimeline.map((item, index) => (
                                <ScrollReveal key={index} direction="up" delay={0.1 + index * 0.08}>
                                    <div className="refund-timeline-step">
                                        <div className="refund-step-number">{item.step}</div>
                                        <div className="refund-step-content">
                                            <h4>{item.title}</h4>
                                            <p>{item.description}</p>
                                            <span className="refund-step-duration">
                                                <FaClock /> {item.duration}
                                            </span>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>
                </ScrollReveal>

                {/* Refund Methods */}
                <ScrollReveal direction="up" delay={0.8}>
                    <section className="legal-section">
                        <h2>6. Refund Methods</h2>
                        <div className="section-content">
                            <p>Refunds are processed to the original payment method used at checkout:</p>
                            <ul className="nested-list">
                                <li><strong>Credit/Debit Card:</strong> Refund credited back to the card within 5–7 business days after processing</li>
                                <li><strong>UPI:</strong> Refund sent to the originating UPI ID within 3–5 business days</li>
                                <li><strong>Net Banking:</strong> Refund credited to the bank account within 5–7 business days</li>
                                <li><strong>Cash on Delivery (COD):</strong> Refund via bank transfer – you'll be asked to provide account details</li>
                            </ul>
                            <p style={{ marginTop: '1rem' }}>
                                <strong>Note:</strong> Processing times may vary depending on your bank or payment provider. 
                                PrintDoot is not responsible for delays caused by third-party payment processors.
                            </p>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Shipping Costs */}
                <ScrollReveal direction="up" delay={0.9}>
                    <section className="legal-section">
                        <h2>7. Return Shipping Costs</h2>
                        <div className="section-content">
                            <ul className="nested-list">
                                <li>If the return is due to our error (defective product, wrong item, misprint), we will cover the return shipping cost</li>
                                <li>If the return is for any other reason (e.g., changed mind), return shipping costs will be deducted from your refund</li>
                                <li>We arrange pickup for most locations. If pickup is not available in your area, we'll provide a return shipping label</li>
                            </ul>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Exchanges */}
                <ScrollReveal direction="up" delay={1.0}>
                    <section className="legal-section">
                        <h2>8. Exchanges</h2>
                        <p>
                            We currently do not offer direct exchanges. If you received the wrong item or a defective product, 
                            please request a return and place a new order. We will prioritize the processing of your refund and 
                            new order to minimize any delay.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Cancellations */}
                <ScrollReveal direction="up" delay={1.1}>
                    <section className="legal-section">
                        <h2>9. Order Cancellations</h2>
                        <div className="section-content">
                            <p>
                                You may cancel your order within <strong>2 hours</strong> of placing it, provided it has not yet entered 
                                production. Once an order is in the "Processing" or "Printing" stage, it cannot be cancelled.
                            </p>
                            <p>
                                To cancel an order, go to My Orders → select the order → click "Cancel Order" (if available), 
                                or contact our support team immediately.
                            </p>
                            <p>
                                If your order is successfully cancelled, a full refund will be issued to your original payment method 
                                within 5–7 business days.
                            </p>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Contact */}
                <ScrollReveal direction="up" delay={1.2}>
                    <section className="legal-section">
                        <h2>10. Contact Us</h2>
                        <p>If you have questions about our refund and return policy, please contact us:</p>
                        <div className="section-content">
                            <p><strong>Email:</strong> <a href="mailto:support@printdoot.com">support@printdoot.com</a></p>
                            <p><strong>Phone:</strong> <a href="tel:+912522669393">+91 2522-669393</a></p>
                            <p><strong>Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM IST</p>
                        </div>
                    </section>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default RefundPolicy;
