import React from 'react';
import { FaLock, FaUserShield, FaDatabase, FaShieldAlt } from 'react-icons/fa';
import ScrollReveal from '../../components/ScrollReveal';
import DynamicLegalPage from './DynamicLegalPage';
import './Legal.css';

const Privacy = () => {
    return (
        <DynamicLegalPage pageType="privacy" title="Privacy Policy" icon={<FaLock />}>
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
                                This Privacy Policy describes how PrintDoot and its affiliates (collectively "PrintDoot, we, our, us") collect, use, share, protect or otherwise process your information / personal data through our website <a href="https://printdoot.com/" target="_blank" rel="noopener noreferrer">https://printdoot.com/</a> (hereinafter referred to as Platform). Please note that you may be able to browse certain sections of the Platform without registering with us. We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India.
                            </p>
                            <p style={{ marginTop: '1rem' }}>
                                By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree please do not use or access our Platform.
                            </p>
                        </div>
                    </ScrollReveal>

                    {/* Privacy Sections */}
                    <div className="legal-content">
                        <ScrollReveal direction="up" delay={0.25}>
                            <section className="legal-section">
                                <h2>1. Collection</h2>
                                <div className="section-content">
                                    <p>
                                        We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time. Some of the information that we may collect includes but is not limited to:
                                    </p>
                                    <div className="data-types-grid">
                                        <div className="data-type-card">
                                            <div className="data-type-icon"><FaUserShield /></div>
                                            <h3>Personal Information</h3>
                                            <ul>
                                                <li>Name, date of birth, address</li>
                                                <li>Telephone/mobile number, email ID</li>
                                                <li>Proof of identity or address documents</li>
                                                <li>Information provided during sign-up/registration</li>
                                            </ul>
                                        </div>
                                        <div className="data-type-card">
                                            <div className="data-type-icon"><FaDatabase /></div>
                                            <h3>Sensitive Personal Data</h3>
                                            <ul>
                                                <li>Bank account or credit/debit card information</li>
                                                <li>Payment instrument information</li>
                                                <li>Biometric information (facial features)</li>
                                                <li>Collected with your consent per applicable laws</li>
                                            </ul>
                                        </div>
                                        <div className="data-type-card">
                                            <div className="data-type-icon"><FaShieldAlt /></div>
                                            <h3>Behavioural Data</h3>
                                            <ul>
                                                <li>Behaviour, preferences on our Platform</li>
                                                <li>Transaction information</li>
                                                <li>Third-party business partner data</li>
                                                <li>Aggregated and analysed data</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '1.5rem' }}>
                                        You always have the option to not provide information, by choosing not to use a particular service or feature on the Platform. If you receive an email, a call from a person/association claiming to be PrintDoot seeking any personal data like debit/credit card PIN, net-banking or mobile banking password, we request you to <strong>never provide such information</strong>. If you have already revealed such information, report it immediately to an appropriate law enforcement agency.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.3}>
                            <section className="legal-section">
                                <h2>2. Usage</h2>
                                <div className="section-content">
                                    <p>We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses. We use your personal data for the following purposes:</p>
                                    <ul className="purpose-list">
                                        {[
                                            'Assist sellers and business partners in handling and fulfilling orders',
                                            'Enhancing customer experience',
                                            'Resolve disputes and troubleshoot problems',
                                            'Inform you about online and offline offers, products, services, and updates',
                                            'Customise your experience on the Platform',
                                            'Detect and protect us against error, fraud and other criminal activity',
                                            'Enforce our terms and conditions',
                                            'Conduct marketing research, analysis and surveys',
                                        ].map((purpose, index) => (
                                            <li key={index}>
                                                <FaShieldAlt className="list-icon" />
                                                <span>{purpose}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <p>You understand that your access to these products/services may be affected in the event permission is not provided to us.</p>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.35}>
                            <section className="legal-section">
                                <h2>3. Sharing</h2>
                                <div className="section-content">
                                    <p>We may share your personal data in the following circumstances:</p>
                                    <div className="sharing-list">
                                        <div className="sharing-item">
                                            <h4>Internal Sharing</h4>
                                            <p>We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out.</p>
                                        </div>
                                        <div className="sharing-item">
                                            <h4>Third-Party Disclosure</h4>
                                            <p>We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment options opted by you.</p>
                                        </div>
                                        <div className="sharing-item">
                                            <h4>Legal Requirements</h4>
                                            <p>We may disclose personal and sensitive personal data to government agencies or other authorised law enforcement agencies if required to do so by law or in the good faith belief that such disclosure is reasonably necessary to respond to subpoenas, court orders, or other legal process.</p>
                                        </div>
                                        <div className="sharing-item">
                                            <h4>Protection of Rights</h4>
                                            <p>We may disclose personal data to enforce our Terms of Use or Privacy Policy; respond to claims that content violates the rights of a third party; or protect the rights, property or personal safety of our users or the general public.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.4}>
                            <section className="legal-section">
                                <h2>4. Security Precautions</h2>
                                <div className="section-content">
                                    <p>
                                        To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server.
                                    </p>
                                    <div className="security-features">
                                        <div className="security-item">
                                            <FaLock />
                                            <span>Secure server access</span>
                                        </div>
                                        <div className="security-item">
                                            <FaLock />
                                            <span>Reasonable security practices</span>
                                        </div>
                                        <div className="security-item">
                                            <FaLock />
                                            <span>Unauthorised access protection</span>
                                        </div>
                                        <div className="security-item">
                                            <FaLock />
                                            <span>Login & password protection</span>
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '1rem' }}>
                                        However, the transmission of information is not completely secure for reasons beyond our control. By using the Platform, the users accept the security implications of data transmission over the internet and the World Wide Web which cannot always be guaranteed as completely secure. Users are responsible for ensuring the protection of login and password records for their account.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.45}>
                            <section className="legal-section">
                                <h2>5. Data Deletion and Retention</h2>
                                <div className="section-content">
                                    <p>
                                        You have an option to delete your account by visiting your profile and settings on our Platform, this action would result in you losing all information related to your account. You may also write to us at the contact information provided below to assist you with these requests.
                                    </p>
                                    <p>
                                        We may in event of any pending grievance, claims, pending shipments or any other services we may refuse or delay deletion of the account. Once the account is deleted, you will lose access to the account.
                                    </p>
                                    <p>
                                        We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes. We may continue to retain your data in anonymised form for analytical and research purposes.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.5}>
                            <section className="legal-section">
                                <h2>6. Your Rights</h2>
                                <div className="section-content">
                                    <p>You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.</p>
                                    <div className="rights-grid">
                                        {[
                                            { title: 'Access', description: 'Access your personal data through the Platform functionalities' },
                                            { title: 'Rectify', description: 'Correct inaccurate or incomplete personal data' },
                                            { title: 'Update', description: 'Update your personal information when needed' },
                                            { title: 'Delete', description: 'Delete your account via profile settings' },
                                        ].map((right, index) => (
                                            <ScrollReveal key={right.title} direction="up" delay={0.1 + index * 0.05}>
                                                <div className="right-card">
                                                    <h4>{right.title}</h4>
                                                    <p>{right.description}</p>
                                                </div>
                                            </ScrollReveal>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.55}>
                            <section className="legal-section">
                                <h2>7. Consent</h2>
                                <div className="section-content">
                                    <p>
                                        By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy.
                                    </p>
                                    <p>
                                        If you disclose to us any personal data relating to other people, you represent that you have the authority to do so and permit us to use the information in accordance with this Privacy Policy.
                                    </p>
                                    <p>
                                        You, while providing your personal data over the Platform or any partner platforms or establishments, consent to us (including our other corporate entities, affiliates, lending partners, technology partners, marketing channels, business partners and other third parties) to contact you through SMS, instant messaging apps, call and/or e-mail for the purposes specified in this Privacy Policy.
                                    </p>
                                    <p>
                                        You have an option to withdraw your consent that you have already provided by writing to the Grievance Officer at the contact information provided below. Please mention <strong>"Withdrawal of consent for processing personal data"</strong> in your subject line. However, please note that your withdrawal of consent will not be retrospective and will be in accordance with the Terms of Use, this Privacy Policy, and applicable laws.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.6}>
                            <section className="legal-section">
                                <h2>8. Changes to this Privacy Policy</h2>
                                <div className="section-content">
                                    <p>
                                        Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert / notify you about the significant changes to the Privacy Policy, in the manner as may be required under applicable laws.
                                    </p>
                                </div>
                            </section>
                        </ScrollReveal>

                        <ScrollReveal direction="up" delay={0.65}>
                            <section className="legal-section">
                                <h2>9. Grievance Officer & Contact</h2>
                                <div className="section-content">
                                    <div className="contact-details">
                                        <p><strong>Company:</strong> PrintDoot</p>
                                        <p><strong>Address:</strong> 15 B HSIIDC SECTOR 31 FARIDABAD, Pin 121003, HARYANA</p>
                                        <p><strong>Email:</strong> support@printdoot.com</p>
                                        <p><strong>Phone:</strong> +91 97172-22125</p>
                                        <p><strong>Hours:</strong> Monday – Friday (9:00 AM – 6:00 PM IST)</p>
                                    </div>
                                </div>
                            </section>
                        </ScrollReveal>
                    </div>

                    {/* Contact CTA */}
                    <ScrollReveal direction="up" delay={0.7}>
                        <div className="legal-contact">
                            <h3>Have Privacy Concerns?</h3>
                            <p>If you have any questions or concerns about your privacy, please get in touch.</p>
                            <a href="/contact" className="btn-primary">Contact Us</a>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </DynamicLegalPage>
    );
};

export default Privacy;
