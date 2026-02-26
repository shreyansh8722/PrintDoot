import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import LottieAnimation from '../../components/LottieAnimation';
import userService from '../../services/userService';
import './Help.css';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: 'general'
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await userService.submitContactForm(formData);
            setSubmitted(true);
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                inquiryType: 'general'
            });
            
            // Reset success message after 5 seconds
            setTimeout(() => setSubmitted(false), 5000);
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                const msgs = Object.entries(data)
                    .map(([key, val]) => Array.isArray(val) ? val.join(', ') : val)
                    .join(' ');
                setError(msgs || 'Failed to send message. Please try again.');
            } else {
                setError('Failed to send message. Please try again later.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="help-page">
            <div className="help-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="help-hero">
                        <h1>Contact Us</h1>
                        <p>We're here to help! Get in touch with our team</p>
                    </div>
                </ScrollReveal>

                <div className="contact-layout">
                    {/* Contact Information */}
                    <ScrollReveal direction="left" delay={0.2}>
                        <div className="contact-info-section">
                            <h2>Get in Touch</h2>
                            <p className="contact-intro">
                                Have a question or need assistance? Reach out to us through any of the channels below.
                            </p>

                            <div className="contact-methods">
                                <ScrollReveal direction="up" delay={0.3}>
                                    <div className="contact-method-card">
                                        <div className="contact-icon phone">
                                            <FaPhone />
                                        </div>
                                        <h3>Phone</h3>
                                        <p>Call us for immediate assistance</p>
                                        <a href="tel:+912522669393" className="contact-link">
                                            +91 2522-669393
                                        </a>
                                        <span className="contact-hours">Mon - Sat, 9 AM - 6 PM IST</span>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal direction="up" delay={0.4}>
                                    <div className="contact-method-card">
                                        <div className="contact-icon email">
                                            <FaEnvelope />
                                        </div>
                                        <h3>Email</h3>
                                        <p>Send us an email anytime</p>
                                        <a href="mailto:support@printdoot.com" className="contact-link">
                                            support@printdoot.com
                                        </a>
                                        <span className="contact-hours">We respond within 24 hours</span>
                                    </div>
                                </ScrollReveal>

                                <ScrollReveal direction="up" delay={0.5}>
                                    <div className="contact-method-card">
                                        <div className="contact-icon location">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <h3>Office</h3>
                                        <p>Visit us at our office</p>
                                        <address className="contact-address">
                                            PrintDoot Office<br />
                                            Business Address<br />
                                            City, State - PIN Code
                                        </address>
                                        <span className="contact-hours">Mon - Sat, 9 AM - 6 PM</span>
                                    </div>
                                </ScrollReveal>
                            </div>

                            <ScrollReveal direction="up" delay={0.6}>
                                <div className="business-hours">
                                    <div className="hours-icon">
                                        <FaClock />
                                    </div>
                                    <div className="hours-content">
                                        <h3>Business Hours</h3>
                                        <div className="hours-list">
                                            <div className="hours-item">
                                                <span>Monday - Friday</span>
                                                <span>9:00 AM - 6:00 PM IST</span>
                                            </div>
                                            <div className="hours-item">
                                                <span>Saturday</span>
                                                <span>9:00 AM - 4:00 PM IST</span>
                                            </div>
                                            <div className="hours-item">
                                                <span>Sunday</span>
                                                <span>Closed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>
                    </ScrollReveal>

                    {/* Contact Form */}
                    <ScrollReveal direction="right" delay={0.2}>
                        <div className="contact-form-section">
                            <h2>Send us a Message</h2>
                            <p className="form-intro">
                                Fill out the form below and we'll get back to you as soon as possible.
                            </p>

                            {submitted && (
                                <div className="success-message">
                                    <FaCheckCircle />
                                    <div>
                                        <h3>Message Sent!</h3>
                                        <p>We've received your message and will get back to you shortly.</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="your.email@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+91 1234567890"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Inquiry Type *</label>
                                        <select
                                            name="inquiryType"
                                            value={formData.inquiryType}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="general">General Inquiry</option>
                                            <option value="order">Order Support</option>
                                            <option value="technical">Technical Support</option>
                                            <option value="billing">Billing Question</option>
                                            <option value="partnership">Partnership</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Subject *</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        placeholder="Brief subject line"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Message *</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        placeholder="Tell us how we can help you..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={submitting || submitted}
                                >
                                    {submitting ? (
                                        <>
                                            <LottieAnimation type="loading" width={20} height={20} />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane />
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </div>
    );
};

export default Contact;
