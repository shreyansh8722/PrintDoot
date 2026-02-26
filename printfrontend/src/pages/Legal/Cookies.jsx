import React from 'react';
import { FaCookie, FaInfoCircle, FaChartBar, FaShoppingCart, FaCog } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import './Legal.css';

const Cookies = () => {
    const cookieTypes = [
        {
            icon: <FaInfoCircle />,
            name: 'Essential Cookies',
            description: 'These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas.',
            examples: [
                'Session management cookies',
                'Authentication cookies',
                'Security cookies',
                'Load balancing cookies'
            ],
            required: true
        },
        {
            icon: <FaChartBar />,
            name: 'Analytics Cookies',
            description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
            examples: [
                'Google Analytics cookies',
                'Page view tracking',
                'User behavior analysis',
                'Performance monitoring'
            ],
            required: false
        },
        {
            icon: <FaShoppingCart />,
            name: 'Functional Cookies',
            description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.',
            examples: [
                'Language preferences',
                'Shopping cart contents',
                'Design preferences',
                'User interface settings'
            ],
            required: false
        },
        {
            icon: <FaCog />,
            name: 'Marketing Cookies',
            description: 'These cookies are used to deliver relevant advertisements and track the effectiveness of our advertising campaigns.',
            examples: [
                'Advertising tracking',
                'Retargeting cookies',
                'Social media integration',
                'Marketing analytics'
            ],
            required: false
        }
    ];

    const cookieDetails = [
        {
            name: '_session_id',
            purpose: 'Maintains your session on our website',
            duration: 'Session',
            type: 'Essential'
        },
        {
            name: '_cart_token',
            purpose: 'Stores items in your shopping cart',
            duration: '30 days',
            type: 'Functional'
        },
        {
            name: '_ga',
            purpose: 'Used by Google Analytics to distinguish users',
            duration: '2 years',
            type: 'Analytics'
        },
        {
            name: '_gid',
            purpose: 'Used by Google Analytics to distinguish users',
            duration: '24 hours',
            type: 'Analytics'
        },
        {
            name: '_fbp',
            purpose: 'Used by Facebook to deliver advertising',
            duration: '90 days',
            type: 'Marketing'
        }
    ];

    return (
        <div className="legal-page">
            <div className="legal-container">
                {/* Hero Section */}
                <ScrollReveal direction="down" delay={0.1}>
                    <div className="legal-hero">
                        <div className="hero-icon">
                            <FaCookie />
                        </div>
                        <h1>Cookie Policy</h1>
                        <p>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </ScrollReveal>

                {/* Introduction */}
                <ScrollReveal direction="up" delay={0.2}>
                    <div className="legal-intro">
                        <p>
                            This Cookie Policy explains what cookies are, how we use cookies on PrintDoot.com, and your choices 
                            regarding cookies. By using our Service, you agree to the use of cookies in accordance with this policy.
                        </p>
                    </div>
                </ScrollReveal>

                {/* What Are Cookies */}
                <ScrollReveal direction="up" delay={0.3}>
                    <section className="legal-section">
                        <h2>1. What Are Cookies</h2>
                        <p>
                            Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
                            They are widely used to make websites work more efficiently and to provide information to website owners.
                        </p>
                        <p>
                            Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device after you close 
                            your browser, while session cookies are deleted when you close your browser.
                        </p>
                    </section>
                </ScrollReveal>

                {/* How We Use Cookies */}
                <ScrollReveal direction="up" delay={0.4}>
                    <section className="legal-section">
                        <h2>2. How We Use Cookies</h2>
                        <p>We use cookies for various purposes, including:</p>
                        <ul className="cookie-uses">
                            <li>To enable certain functions of the Service</li>
                            <li>To provide analytics and improve our Service</li>
                            <li>To store your preferences and personalize your experience</li>
                            <li>To enable advertisements and marketing</li>
                            <li>To ensure security and prevent fraud</li>
                        </ul>
                    </section>
                </ScrollReveal>

                {/* Types of Cookies */}
                <ScrollReveal direction="up" delay={0.5}>
                    <section className="legal-section">
                        <h2>3. Types of Cookies We Use</h2>
                        <div className="cookie-types-grid">
                            {cookieTypes.map((type, index) => (
                                <ScrollReveal key={type.name} direction="up" delay={0.1 + index * 0.1}>
                                    <div className="cookie-type-card">
                                        <div className="cookie-type-header">
                                            <div className="cookie-type-icon">{type.icon}</div>
                                            <div>
                                                <h3>{type.name}</h3>
                                                {type.required && (
                                                    <span className="required-badge">Required</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="cookie-type-description">{type.description}</p>
                                        <div className="cookie-examples">
                                            <strong>Examples:</strong>
                                            <ul>
                                                {type.examples.map((example, exampleIndex) => (
                                                    <li key={exampleIndex}>{example}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </section>
                </ScrollReveal>

                {/* Cookie Details Table */}
                <ScrollReveal direction="up" delay={0.6}>
                    <section className="legal-section">
                        <h2>4. Specific Cookies We Use</h2>
                        <div className="cookie-table-wrapper">
                            <table className="cookie-table">
                                <thead>
                                    <tr>
                                        <th>Cookie Name</th>
                                        <th>Purpose</th>
                                        <th>Duration</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cookieDetails.map((cookie, index) => (
                                        <tr key={index}>
                                            <td><code>{cookie.name}</code></td>
                                            <td>{cookie.purpose}</td>
                                            <td>{cookie.duration}</td>
                                            <td>
                                                <span className={`cookie-type-badge ${cookie.type.toLowerCase()}`}>
                                                    {cookie.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Third-Party Cookies */}
                <ScrollReveal direction="up" delay={0.7}>
                    <section className="legal-section">
                        <h2>5. Third-Party Cookies</h2>
                        <p>
                            In addition to our own cookies, we may also use various third-party cookies to report usage statistics 
                            of the Service, deliver advertisements, and so on. These third-party cookies include:
                        </p>
                        <div className="third-party-list">
                            <div className="third-party-item">
                                <h4>Google Analytics</h4>
                                <p>Used for website analytics and performance monitoring. For more information, visit <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</p>
                            </div>
                            <div className="third-party-item">
                                <h4>Payment Processors</h4>
                                <p>Our payment gateway partners may use cookies to process payments securely and prevent fraud.</p>
                            </div>
                            <div className="third-party-item">
                                <h4>Social Media Platforms</h4>
                                <p>Social media plugins and integration may use cookies when you interact with social features.</p>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Your Choices */}
                <ScrollReveal direction="up" delay={0.8}>
                    <section className="legal-section">
                        <h2>6. Your Cookie Choices</h2>
                        <p>
                            You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you 
                            can usually modify your browser settings to decline cookies if you prefer.
                        </p>
                        <div className="cookie-choices">
                            <div className="choice-item">
                                <h4>Browser Settings</h4>
                                <p>You can control cookies through your browser settings. However, blocking cookies may affect the functionality of our Service.</p>
                            </div>
                            <div className="choice-item">
                                <h4>Cookie Consent</h4>
                                <p>When you first visit our website, you will see a cookie consent banner where you can choose which cookies to accept.</p>
                            </div>
                            <div className="choice-item">
                                <h4>Opt-Out Links</h4>
                                <p>For specific third-party cookies, you can opt out through their respective privacy policies and opt-out mechanisms.</p>
                            </div>
                        </div>
                    </section>
                </ScrollReveal>

                {/* Do Not Track */}
                <ScrollReveal direction="up" delay={0.9}>
                    <section className="legal-section">
                        <h2>7. Do Not Track Signals</h2>
                        <p>
                            Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not 
                            want to have your online activity tracked. Currently, there is no standard for how DNT signals should be 
                            interpreted. As a result, we do not currently respond to DNT browser signals or mechanisms.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Updates */}
                <ScrollReveal direction="up" delay={0.95}>
                    <section className="legal-section">
                        <h2>8. Updates to This Cookie Policy</h2>
                        <p>
                            We may update this Cookie Policy from time to time to reflect changes in our practices or for other 
                            operational, legal, or regulatory reasons. Please review this policy periodically for any changes.
                        </p>
                    </section>
                </ScrollReveal>

                {/* Contact */}
                <ScrollReveal direction="up" delay={1.0}>
                    <div className="legal-contact">
                        <h3>Questions About Cookies?</h3>
                        <p>If you have any questions about our use of cookies, please contact us.</p>
                        <a href="/contact" className="btn-primary">
                            Contact Us
                        </a>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default Cookies;
