import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaQuestionCircle } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import LottieAnimation from '../../components/LottieAnimation';
import './Help.css';

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    const faqCategories = [
        { id: 'all', name: 'All Questions' },
        { id: 'ordering', name: 'Ordering & Payment' },
        { id: 'shipping', name: 'Shipping & Delivery' },
        { id: 'products', name: 'Products & Design' },
        { id: 'returns', name: 'Returns & Refunds' },
        { id: 'account', name: 'Account & Technical' }
    ];

    const faqs = [
        {
            id: 1,
            category: 'ordering',
            question: 'How do I place an order?',
            answer: 'Placing an order is easy! Simply browse our products, customize your design using our editor, add items to your cart, and proceed to checkout. You\'ll need to create an account if you don\'t have one already. Follow the checkout steps to complete your order.'
        },
        {
            id: 2,
            category: 'ordering',
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards, debit cards, UPI, net banking, and cash on delivery (COD) for eligible orders. All payments are processed securely through our encrypted payment gateway.'
        },
        {
            id: 3,
            category: 'ordering',
            question: 'Can I modify or cancel my order after placing it?',
            answer: 'You can modify or cancel your order within 2 hours of placing it. After that, your order enters production and cannot be cancelled. To cancel, go to your order details page or contact our support team immediately.'
        },
        {
            id: 4,
            category: 'shipping',
            question: 'How long does shipping take?',
            answer: 'Standard shipping typically takes 5-7 business days after your order is printed and ready. Express shipping options (2-3 business days) are available at checkout. Production time varies by product type but is usually 2-3 business days.'
        },
        {
            id: 5,
            category: 'shipping',
            question: 'Do you ship internationally?',
            answer: 'Currently, we ship within India only. We\'re working on expanding our shipping options to other countries. Please check back soon or contact us for updates on international shipping.'
        },
        {
            id: 6,
            category: 'shipping',
            question: 'How can I track my order?',
            answer: 'Once your order ships, you\'ll receive a tracking number via email. You can track your order in the "My Orders" section of your account or use the tracking number on our tracking page. You\'ll also receive SMS updates on major delivery milestones.'
        },
        {
            id: 7,
            category: 'products',
            question: 'Can I customize the design of my products?',
            answer: 'Yes! We offer a powerful design editor where you can customize text, images, colors, and layouts. You can upload your own images and logos, choose from our template library, or create a design from scratch. Our Zakeke integration also provides advanced customization options.'
        },
        {
            id: 8,
            category: 'products',
            question: 'What file formats do you accept for uploads?',
            answer: 'We accept JPG, PNG, PDF, SVG, and AI files. For best print quality, we recommend high-resolution images (300 DPI or higher). Vector formats (SVG, AI) are ideal for logos and graphics that need to scale.'
        },
        {
            id: 9,
            category: 'products',
            question: 'Can I see a proof before printing?',
            answer: 'Yes! Before your order goes to print, you\'ll receive a digital proof via email for review. You can approve it or request changes. Once approved, your order will proceed to production.'
        },
        {
            id: 10,
            category: 'returns',
            question: 'What is your return policy?',
            answer: 'We accept returns within 14 days of delivery for defective or incorrectly printed items. Customized products cannot be returned unless there\'s a printing error on our part. Returns must be in original packaging. Please contact our support team to initiate a return.'
        },
        {
            id: 11,
            category: 'returns',
            question: 'How do I return an item?',
            answer: 'To return an item, log into your account, go to "My Orders", select the order you want to return, and click "Request Return". Our team will review your request and provide a return shipping label if approved. Once we receive the item, we\'ll process your refund within 5-7 business days.'
        },
        {
            id: 12,
            category: 'returns',
            question: 'How long do refunds take?',
            answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The refund will be credited to your original payment method. It may take an additional 3-5 business days for the refund to appear in your account, depending on your bank or card issuer.'
        },
        {
            id: 13,
            category: 'account',
            question: 'How do I create an account?',
            answer: 'Click on "Sign In" in the top navigation, then select "Create Account". You can sign up using your email address or phone number. You\'ll need to verify your email/phone to complete registration.'
        },
        {
            id: 14,
            category: 'account',
            question: 'I forgot my password. How do I reset it?',
            answer: 'On the login page, click "Forgot Password" and enter your email address. You\'ll receive a password reset link via email. Click the link and follow the instructions to create a new password.'
        },
        {
            id: 15,
            category: 'account',
            question: 'Can I save my designs for future orders?',
            answer: 'Yes! All your designs are automatically saved to your account. You can access them in the "My Designs" section, where you can edit, reuse, or reorder them anytime.'
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const filteredFAQs = faqs.filter(faq => {
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        const matchesSearch = searchTerm === '' || 
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="help-page">
            <div className="help-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="help-hero">
                        <div className="hero-icon">
                            <FaQuestionCircle />
                        </div>
                        <h1>Frequently Asked Questions</h1>
                        <p>Find answers to common questions about our products and services</p>
                    </div>
                </ScrollReveal>

                {/* Search Bar */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="faq-search">
                        <div className="search-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search for questions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="faq-search-input"
                            />
                        </div>
                    </div>
                </ScrollReveal>

                {/* Categories */}
                <ScrollReveal direction="up" delay={0.3}>
                    <div className="faq-categories">
                        {faqCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </ScrollReveal>

                {/* FAQ List */}
                <div className="faq-list">
                    {filteredFAQs.length === 0 ? (
                        <ScrollReveal direction="fade" delay={0.3}>
                            <div className="empty-faq">
                                <LottieAnimation type="empty" width={200} height={200} />
                                <h3>No questions found</h3>
                                <p>Try adjusting your search or category filter</p>
                            </div>
                        </ScrollReveal>
                    ) : (
                        filteredFAQs.map((faq, index) => (
                            <ScrollReveal key={faq.id} direction="up" delay={0.1 + index * 0.05}>
                                <div className={`faq-item ${openIndex === index ? 'open' : ''}`}>
                                    <button
                                        className="faq-question"
                                        onClick={() => toggleFAQ(index)}
                                    >
                                        <span>{faq.question}</span>
                                        {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
                                    </button>
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))
                    )}
                </div>

                {/* Still Have Questions */}
                <ScrollReveal direction="up" delay={0.4}>
                    <div className="faq-footer">
                        <h3>Still have questions?</h3>
                        <p>Can't find the answer you're looking for? Please get in touch with our friendly team.</p>
                        <a href="/contact" className="btn-primary">
                            Contact Us
                        </a>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default FAQ;
