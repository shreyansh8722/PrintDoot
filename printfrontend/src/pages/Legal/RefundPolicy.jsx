import React from 'react';
import { FaUndo, FaCheckCircle, FaTimesCircle, FaClock, FaTruck } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import DynamicLegalPage from './DynamicLegalPage';
import './Legal.css';

const RefundPolicy = () => {
    return (
        <DynamicLegalPage pageType="refund" title="Refund, Cancellation & Return Policy" icon={<FaUndo />}>
            <div className="legal-page">
                <div className="legal-container">
                    {/* Hero Section */}
                    <ScrollReveal direction="down" delay={0.1}>
                        <div className="legal-hero">
                            <div className="hero-icon">
                                <FaUndo />
                            </div>
                            <h1>Refund, Cancellation &amp; Return Policy</h1>
                            <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </ScrollReveal>

                    {/* Introduction */}
                    <ScrollReveal direction="up" delay={0.2}>
                        <div className="legal-intro">
                            <p>
                                This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service that you have purchased through the Platform. Please read the following sections carefully.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="legal-content">
                        {/* Cancellation Policy */}
                        <ScrollReveal direction="up" delay={0.25}>
                            <section className="legal-section">
                                <h2>1. Cancellation Policy</h2>
                                <div className="section-content">
                                    <p>
                                        Cancellations will only be considered if the request is made within <strong>2 days</strong> of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers / merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery.
                                    </p>
                                    <p>
                                        In such an event, you may choose to reject the product at the doorstep.
                                    </p>
                                    <div className="rights-note">
                                        <strong>Note:</strong> PrintDoot does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund / replacement can be made if the user establishes that the quality of the product delivered is not good.
                                    </div>
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Damaged / Defective Items */}
                        <ScrollReveal direction="up" delay={0.3}>
                            <section className="legal-section">
                                <h2>2. Damaged or Defective Items</h2>
                                <div className="section-content">
                                    <p>
                                        In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller / merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within <strong>2 days</strong> of receipt of products.
                                    </p>
                                    <p>
                                        In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within <strong>2 days</strong> of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.
                                    </p>
                                    <p>
                                        In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Refund Processing */}
                        <ScrollReveal direction="up" delay={0.35}>
                            <section className="legal-section">
                                <h2>3. Refund Processing</h2>
                                <div className="section-content">
                                    <p>In case of any refunds approved by PrintDoot, it will take <strong>1 day</strong> for the refund to be processed to you.</p>
                                    <div className="refund-timeline">
                                        {[
                                            { step: '1', title: 'Report the Issue', description: 'Contact customer service within 2 days of receiving the product with photos if applicable.', duration: 'Day 0' },
                                            { step: '2', title: 'Review & Verification', description: 'Our team and the seller/merchant verify the issue at their end.', duration: '1–2 business days' },
                                            { step: '3', title: 'Approval & Refund', description: 'Once approved, refund is processed to your original payment method.', duration: '1 business day' },
                                        ].map((item, index) => (
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
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Return Policy */}
                        <ScrollReveal direction="up" delay={0.4}>
                            <section className="legal-section">
                                <h2>4. Return Policy</h2>
                                <div className="section-content">
                                    <p>
                                        We offer refund / exchange within the first <strong>1 day</strong> from the date of your purchase. If 1 day has passed since your purchase, you will not be offered a return, exchange or refund of any kind.
                                    </p>

                                    <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: '#1a1a1a' }}>Eligible for Return</h4>
                                    <ul className="purpose-list">
                                        {[
                                            'The purchased item should be unused and in the same condition as you received it',
                                            'The item must have original packaging',
                                            'Defective or damaged products are eligible for replacement',
                                        ].map((item, index) => (
                                            <li key={index}>
                                                <FaCheckCircle className="list-icon" style={{ color: '#059669' }} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 600, color: '#1a1a1a' }}>Not Eligible for Return</h4>
                                    <ul className="purpose-list">
                                        {[
                                            'Items purchased on sale may not be eligible for return/exchange',
                                            'Certain category of products/items exempted from returns',
                                            'Items returned after the return window has passed',
                                        ].map((item, index) => (
                                            <li key={index}>
                                                <FaTimesCircle className="list-icon" style={{ color: '#ef4444' }} />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <p style={{ marginTop: '1rem' }}>
                                        For exchange / return accepted request(s) (as applicable), once your returned product / item is received and inspected by us, we will send you an email to notify you about receipt of the returned / exchanged product. If the same has been approved after the quality check at our end, your request (i.e. return/exchange) will be processed in accordance with our policies.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Shipping Policy */}
                        <ScrollReveal direction="up" delay={0.45}>
                            <section className="legal-section">
                                <h2>5. Shipping Policy</h2>
                                <div className="section-content">
                                    <p>
                                        The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within <strong>2 days</strong> from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company / post office norms.
                                    </p>
                                    <div className="sharing-list">
                                        <div className="sharing-item">
                                            <h4><FaTruck style={{ marginRight: '0.5rem', display: 'inline' }} />Shipping Timeline</h4>
                                            <p>Orders are shipped within 2 days from the date of order/payment.</p>
                                        </div>
                                        <div className="sharing-item">
                                            <h4>Delivery Address</h4>
                                            <p>Delivery of all orders will be made to the address provided by the buyer at the time of purchase.</p>
                                        </div>
                                        <div className="sharing-item">
                                            <h4>Confirmation</h4>
                                            <p>Delivery of our services will be confirmed on your email ID as specified at the time of registration.</p>
                                        </div>
                                    </div>
                                    <div className="rights-note" style={{ marginTop: '1.5rem' }}>
                                        <strong>Note:</strong> Platform Owner shall not be liable for any delay in delivery by the courier company / postal authority. If there are any shipping cost(s) levied by the seller or the Platform Owner, the same is not refundable.
                                    </div>
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Contact */}
                        <ScrollReveal direction="up" delay={0.5}>
                            <section className="legal-section">
                                <h2>6. Contact Us</h2>
                                <div className="section-content">
                                    <p>If you have questions about our refund and return policy, please contact us:</p>
                                    <div className="contact-details">
                                        <p><strong>Email:</strong> <a href="mailto:support@printdoot.com">support@printdoot.com</a></p>
                                        <p><strong>Phone:</strong> <a href="tel:+919717222125">+91 97172-22125</a></p>
                                        <p><strong>Address:</strong> 15 B HSIIDC SECTOR 31 FARIDABAD, Pin 121003, HARYANA</p>
                                        <p><strong>Hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM IST</p>
                                    </div>
                                </div>
                            </section>
                        </ScrollReveal>
                    </div>

                    {/* Contact CTA */}
                    <ScrollReveal direction="up" delay={0.55}>
                        <div className="legal-contact">
                            <h3>Need Help with Returns?</h3>
                            <p>Our customer service team is here to assist you.</p>
                            <a href="/contact" className="btn-primary">Contact Us</a>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </DynamicLegalPage>
    );
};

export default RefundPolicy;
