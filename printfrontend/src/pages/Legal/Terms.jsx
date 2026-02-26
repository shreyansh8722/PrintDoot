import React from 'react';
import { FaGavel, FaCheckCircle, FaFileContract } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import './Legal.css';

const Terms = () => {
    const sections = [
        {
            id: 'acceptance',
            title: '1. Acceptance of Terms',
            content: [
                'By accessing and using PrintDoot.com (the "Service"), you accept and agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.',
                'We reserve the right to update, change, or replace any part of these Terms at any time. It is your responsibility to check this page periodically for changes. Your continued use of the Service following the posting of any changes constitutes acceptance of those changes.'
            ]
        },
        {
            id: 'use-of-service',
            title: '2. Use of Service',
            content: [
                'You must be at least 18 years old or have parental consent to use our Service. You agree to provide accurate, current, and complete information during the registration process.',
                'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.',
                'You agree not to use the Service:',
                [
                    'For any unlawful purpose or to solicit others to perform unlawful acts',
                    'To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances',
                    'To infringe upon or violate our intellectual property rights or the intellectual property rights of others',
                    'To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate',
                    'To submit false or misleading information',
                    'To upload or transmit viruses or any other type of malicious code',
                    'To collect or track the personal information of others',
                    'To spam, phish, pharm, pretext, spider, crawl, or scrape'
                ]
            ]
        },
        {
            id: 'products-and-pricing',
            title: '3. Products and Pricing',
            content: [
                'We reserve the right to change prices for our products at any time without prior notice.',
                'All products are subject to availability. We reserve the right to discontinue any product at any time.',
                'Images of products are for illustrative purposes only. Actual products may vary slightly from images.',
                'We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in pricing or product information, or fraud.',
                'All prices are in Indian Rupees (INR) unless otherwise stated. Prices include applicable taxes but exclude shipping charges unless otherwise indicated.'
            ]
        },
        {
            id: 'orders-and-payments',
            title: '4. Orders and Payments',
            content: [
                'When you place an order, you are making an offer to purchase products at the prices stated on the website.',
                'We will send you an order confirmation email once your order is received. This does not constitute acceptance of your order.',
                'We reserve the right to accept or reject your order. If we reject your order after payment, we will refund the amount paid.',
                'Payment must be made at the time of placing the order. We accept payment via credit cards, debit cards, UPI, net banking, and cash on delivery (where available).',
                'All payments are processed securely through our payment gateway partners. We do not store your complete payment card details on our servers.'
            ]
        },
        {
            id: 'designs-and-content',
            title: '5. Designs and Content',
            content: [
                'You retain ownership of any designs, images, or content you upload to our Service.',
                'By uploading content, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of fulfilling your orders and providing our services.',
                'You represent and warrant that:',
                [
                    'You own or have the necessary rights and permissions to use and authorize us to use all content you upload',
                    'Your content does not infringe upon any third-party rights, including intellectual property, privacy, or publicity rights',
                    'Your content is not defamatory, obscene, or otherwise illegal',
                    'Your content does not contain viruses or other harmful code'
                ],
                'We reserve the right to reject, refuse, or remove any content that violates these Terms or our content guidelines.'
            ]
        },
        {
            id: 'intellectual-property',
            title: '6. Intellectual Property',
            content: [
                'All content, features, and functionality of the Service, including but not limited to text, graphics, logos, images, and software, are owned by PrintDoot or its licensors and are protected by copyright, trademark, and other intellectual property laws.',
                'You may not reproduce, distribute, modify, create derivative works, publicly display, or otherwise exploit any content from our Service without our express written permission.',
                'The PrintDoot name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of PrintDoot or its affiliates.'
            ]
        },
        {
            id: 'returns-and-refunds',
            title: '7. Returns and Refunds',
            content: [
                'Our return policy is detailed in our Returns & Refunds page. By placing an order, you agree to our return policy.',
                'Refunds will be processed to the original payment method within 5-7 business days after we receive and inspect returned items.',
                'Customized products may not be eligible for return unless they are defective or we made an error.',
                'Shipping costs for returns may be deducted from your refund unless the return is due to our error or a defective product.'
            ]
        },
        {
            id: 'limitation-of-liability',
            title: '8. Limitation of Liability',
            content: [
                'To the maximum extent permitted by law, PrintDoot shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.',
                'Our total liability to you for all claims arising from or related to the Service shall not exceed the amount you paid to us in the 12 months preceding the claim.',
                'We do not warrant that the Service will be uninterrupted, secure, or error-free, or that defects will be corrected.'
            ]
        },
        {
            id: 'indemnification',
            title: '9. Indemnification',
            content: [
                'You agree to defend, indemnify, and hold harmless PrintDoot and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or in any way connected with:',
                [
                    'Your use of the Service',
                    'Your violation of these Terms',
                    'Your violation of any third-party right, including any intellectual property or privacy right',
                    'Any content you submit, post, or transmit through the Service'
                ]
            ]
        },
        {
            id: 'termination',
            title: '10. Termination',
            content: [
                'We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.',
                'Upon termination, your right to use the Service will cease immediately.',
                'All provisions of these Terms which by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.'
            ]
        },
        {
            id: 'governing-law',
            title: '11. Governing Law',
            content: [
                'These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.',
                'Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts located in [City], [State], India.'
            ]
        },
        {
            id: 'contact',
            title: '12. Contact Information',
            content: [
                'If you have any questions about these Terms, please contact us at:',
                'Email: legal@printdoot.com',
                'Phone: +91 2522-669393',
                'Address: PrintDoot Office, Business Address, City, State - PIN Code'
            ]
        }
    ];

    return (
        <div className="legal-page">
            <div className="legal-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="legal-hero">
                        <div className="hero-icon">
                            <FaGavel />
                        </div>
                        <h1>Terms of Service</h1>
                        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </ScrollReveal>

                {/* Introduction */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="legal-intro">
                        <p>
                            Welcome to PrintDoot. These Terms of Service ("Terms") govern your access to and use of 
                            PrintDoot.com and our services. Please read these Terms carefully before using our Service.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Table of Contents */}
                <ScrollReveal direction="up" delay={0.3}>
                    <div className="table-of-contents">
                        <h2>Table of Contents</h2>
                        <ul>
                            {sections.map((section, index) => (
                                <li key={section.id}>
                                    <a href={`#${section.id}`}>
                                        {section.title.replace(/^\d+\.\s/, '')}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </ScrollReveal>

                {/* Terms Sections */}
                <div className="legal-content">
                    {sections.map((section, index) => (
                        <ScrollReveal key={section.id} direction="up" delay={0.1 + index * 0.05}>
                            <section id={section.id} className="legal-section">
                                <h2>{section.title}</h2>
                                <div className="section-content">
                                    {section.content.map((item, itemIndex) => {
                                        if (Array.isArray(item)) {
                                            return (
                                                <ul key={itemIndex} className="nested-list">
                                                    {item.map((listItem, listIndex) => (
                                                        <li key={listIndex}>{listItem}</li>
                                                    ))}
                                                </ul>
                                            );
                                        }
                                        return <p key={itemIndex}>{item}</p>;
                                    })}
                                </div>
                            </section>
                        </ScrollReveal>
                    ))}
                </div>

                {/* Agreement */}
                <ScrollReveal direction="up" delay={0.4}>
                    <div className="legal-agreement">
                        <div className="agreement-icon">
                            <FaFileContract />
                        </div>
                        <h2>Agreement to Terms</h2>
                        <p>
                            By using our Service, you acknowledge that you have read, understood, and agree to be bound 
                            by these Terms of Service. If you do not agree to these Terms, please do not use our Service.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Contact */}
                <ScrollReveal direction="up" delay={0.5}>
                    <div className="legal-contact">
                        <h3>Questions About These Terms?</h3>
                        <p>If you have any questions, please contact us.</p>
                        <a href="/contact" className="btn-primary">
                            Contact Us
                        </a>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default Terms;
