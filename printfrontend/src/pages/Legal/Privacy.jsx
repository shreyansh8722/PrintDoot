import React from 'react';
import { FaShieldAlt, FaLock, FaUserShield, FaDatabase } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import './Legal.css';

const Privacy = () => {
    const dataTypes = [
        {
            icon: <FaUserShield />,
            title: 'Personal Information',
            items: [
                'Name and contact information (email, phone, address)',
                'Account credentials (username, password)',
                'Payment information (processed securely through payment gateways)',
                'Order history and preferences'
            ]
        },
        {
            icon: <FaDatabase />,
            title: 'Usage Data',
            items: [
                'IP address and browser type',
                'Device information',
                'Pages visited and time spent on pages',
                'Search queries and interactions with our Service'
            ]
        },
        {
            icon: <FaShieldAlt />,
            title: 'Design Files',
            items: [
                'Designs and images you upload',
                'Customization preferences',
                'Saved designs and templates'
            ]
        }
    ];

    const purposes = [
        'To process and fulfill your orders',
        'To communicate with you about your orders and our services',
        'To improve and personalize your experience',
        'To send you marketing communications (with your consent)',
        'To prevent fraud and ensure security',
        'To comply with legal obligations',
        'To analyze usage patterns and improve our Service'
    ];

    const rights = [
        {
            title: 'Access',
            description: 'Request a copy of the personal data we hold about you'
        },
        {
            title: 'Rectification',
            description: 'Request correction of inaccurate or incomplete data'
        },
        {
            title: 'Erasure',
            description: 'Request deletion of your personal data (subject to legal requirements)'
        },
        {
            title: 'Restriction',
            description: 'Request restriction of processing of your personal data'
        },
        {
            title: 'Portability',
            description: 'Request transfer of your data to another service provider'
        },
        {
            title: 'Objection',
            description: 'Object to processing of your personal data for marketing purposes'
        }
    ];

    return (
        <div className="legal-page">
            <div className="legal-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="legal-hero">
                        <div className="hero-icon">
                            <FaLock />
                        </div>
                        <h1>Privacy Policy</h1>
                        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </ScrollReveal>

                {/* Introduction */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="legal-intro">
                        <p>
                            At PrintDoot, we are committed to protecting your privacy. This Privacy Policy explains how we collect, 
                            use, disclose, and safeguard your information when you use our Service. Please read this policy carefully 
                            to understand our practices regarding your personal data.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Information We Collect */}
                <ScrollReveal direction="up" delay={0.3}>
                    <section className="legal-section">
                        <h2>1. Information We Collect</h2>
                        <p>
                            We collect information that you provide directly to us, information we obtain automatically when you use 
                            our Service, and information from third-party sources.
                        </p>
                        <div className="data-types-grid">
                            {dataTypes.map((type, index) => (
                                <ScrollReveal key={type.title} direction="up" delay={0.1 + index * 0.1}>
                                    <div className="data-type-card">
                                        <div className="data-type-icon">{type.icon}</div>
                                        <h3>{type.title}</h3>
                                        <ul>
                                            {type.items.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>
                </ScrollReveal>

                {/* How We Use Your Information */}
                <ScrollReveal direction="up" delay={0.4}>
                    <section className="legal-section">
                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect for various purposes, including:</p>
                        <ul className="purpose-list">
                            {purposes.map((purpose, index) => (
                                <li key={index}>
                                    <FaShieldAlt className="list-icon" />
                                    <span>{purpose}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </ScrollReveal>

                {/* Information Sharing */}
                <ScrollReveal direction="up" delay={0.5}>
                    <section className="legal-section">
                        <h2>3. Information Sharing and Disclosure</h2>
                        <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
                        <div className="sharing-list">
                            <div className="sharing-item">
                                <h4>Service Providers</h4>
                                <p>We share information with third-party service providers who perform services on our behalf, such as payment processing, shipping, and data analytics.</p>
                            </div>
                            <div className="sharing-item">
                                <h4>Legal Requirements</h4>
                                <p>We may disclose information if required by law or in response to valid requests by public authorities.</p>
                            </div>
                            <div className="sharing-item">
                                <h4>Business Transfers</h4>
                                <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
                            </div>
                            <div className="sharing-item">
                                <h4>With Your Consent</h4>
                                <p>We may share your information with your explicit consent or at your direction.</p>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Data Security */}
                <ScrollReveal direction="up" delay={0.6}>
                    <section className="legal-section">
                        <h2>4. Data Security</h2>
                        <p>
                            We implement appropriate technical and organizational measures to protect your personal information. 
                            However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
                            strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
                        </p>
                        <div className="security-features">
                            <div className="security-item">
                                <FaLock />
                                <span>SSL encryption for data transmission</span>
                            </div>
                            <div className="security-item">
                                <FaLock />
                                <span>Secure payment processing</span>
                            </div>
                            <div className="security-item">
                                <FaLock />
                                <span>Regular security audits</span>
                            </div>
                            <div className="security-item">
                                <FaLock />
                                <span>Access controls and authentication</span>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Your Rights */}
                <ScrollReveal direction="up" delay={0.7}>
                    <section className="legal-section">
                        <h2>5. Your Rights</h2>
                        <p>You have certain rights regarding your personal information:</p>
                        <div className="rights-grid">
                            {rights.map((right, index) => (
                                <ScrollReveal key={right.title} direction="up" delay={0.1 + index * 0.05}>
                                    <div className="right-card">
                                        <h4>{right.title}</h4>
                                        <p>{right.description}</p>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                        <p className="rights-note">
                            To exercise any of these rights, please contact us using the information provided in the Contact section.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Cookies */}
                <ScrollReveal direction="up" delay={0.8}>
                    <section className="legal-section">
                        <h2>6. Cookies and Tracking Technologies</h2>
                        <p>
                            We use cookies and similar tracking technologies to track activity on our Service and store certain 
                            information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
                            However, if you do not accept cookies, you may not be able to use some portions of our Service.
                        </p>
                        <p>For more detailed information, please see our <a href="/cookies">Cookie Policy</a>.</p>
                    </section>
                </ScrollReveal>

                {/* Data Retention */}
                <ScrollReveal direction="up" delay={0.9}>
                    <section className="legal-section">
                        <h2>7. Data Retention</h2>
                        <p>
                            We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
                            Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need 
                            your information, we will delete or anonymize it in accordance with our data retention policies.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Children's Privacy */}
                <ScrollReveal direction="up" delay={0.95}>
                    <section className="legal-section">
                        <h2>8. Children's Privacy</h2>
                        <p>
                            Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal 
                            information from children under 18. If you become aware that a child has provided us with personal 
                            information, please contact us, and we will take steps to delete such information.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Changes to Policy */}
                <ScrollReveal direction="up" delay={0.98}>
                    <section className="legal-section">
                        <h2>9. Changes to This Privacy Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                            new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this 
                            Privacy Policy periodically for any changes.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Contact */}
                <ScrollReveal direction="up" delay={1.0}>
                    <section className="legal-section">
                        <h2>10. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, please contact us:</p>
                        <div className="contact-details">
                            <p><strong>Email:</strong> privacy@printdoot.com</p>
                            <p><strong>Phone:</strong> +91 2522-669393</p>
                            <p><strong>Address:</strong> PrintDoot Office, Business Address, City, State - PIN Code</p>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Contact CTA */}
                <ScrollReveal direction="up" delay={1.1}>
                    <div className="legal-contact">
                        <h3>Have Privacy Concerns?</h3>
                        <p>If you have any questions or concerns about your privacy, please get in touch.</p>
                        <a href="/contact" className="btn-primary">
                            Contact Us
                        </a>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default Privacy;
