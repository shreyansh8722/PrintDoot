import React from 'react';
import DynamicLegalPage from './DynamicLegalPage';
import './Legal.css';

const Cookies = () => {
    return (
        <DynamicLegalPage pageType="cookies" title="Cookie Policy" icon={null}>
            <div className="legal-page">
                <div className="legal-plain">
                    <h1>Cookie Policy</h1>
                    <p className="legal-updated">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <p>
                        This Cookie Policy explains what cookies are, how we use cookies on PrintDoot.com, and your choices
                        regarding cookies. By using our Service, you agree to the use of cookies in accordance with this policy.
                    </p>

                    <h2>1. What Are Cookies</h2>
                    <p>
                        Cookies are small text files that are placed on your computer or mobile device when you visit a website.
                        They are widely used to make websites work more efficiently and to provide information to website owners.
                        Cookies can be "persistent" or "session" cookies. Persistent cookies remain on your device after you close
                        your browser, while session cookies are deleted when you close your browser.
                    </p>

                    <h2>2. How We Use Cookies</h2>
                    <p>We use cookies for various purposes, including:</p>
                    <ul>
                        <li>To enable certain functions of the Service</li>
                        <li>To provide analytics and improve our Service</li>
                        <li>To store your preferences and personalize your experience</li>
                        <li>To enable advertisements and marketing</li>
                        <li>To ensure security and prevent fraud</li>
                    </ul>

                    <h2>3. Types of Cookies We Use</h2>

                    <p><strong>Essential Cookies (Required)</strong> — These cookies are necessary for the website to function properly. They enable basic functions like page navigation, session management, authentication, and security.</p>

                    <p><strong>Analytics Cookies</strong> — These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. Examples include Google Analytics cookies, page view tracking, and performance monitoring.</p>

                    <p><strong>Functional Cookies</strong> — These cookies enable enhanced functionality and personalization, such as remembering your language preferences, shopping cart contents, design preferences, and user interface settings.</p>

                    <p><strong>Marketing Cookies</strong> — These cookies are used to deliver relevant advertisements and track the effectiveness of our advertising campaigns, including retargeting cookies and social media integration.</p>

                    <h2>4. Specific Cookies We Use</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Cookie Name</th>
                                <th>Purpose</th>
                                <th>Duration</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td><code>_session_id</code></td><td>Maintains your session on our website</td><td>Session</td><td>Essential</td></tr>
                            <tr><td><code>_cart_token</code></td><td>Stores items in your shopping cart</td><td>30 days</td><td>Functional</td></tr>
                            <tr><td><code>_ga</code></td><td>Used by Google Analytics to distinguish users</td><td>2 years</td><td>Analytics</td></tr>
                            <tr><td><code>_gid</code></td><td>Used by Google Analytics to distinguish users</td><td>24 hours</td><td>Analytics</td></tr>
                            <tr><td><code>_fbp</code></td><td>Used by Facebook to deliver advertising</td><td>90 days</td><td>Marketing</td></tr>
                        </tbody>
                    </table>

                    <h2>5. Third-Party Cookies</h2>
                    <p>
                        In addition to our own cookies, we may also use various third-party cookies to report usage statistics
                        of the Service, deliver advertisements, and so on. These include Google Analytics (for website analytics and performance monitoring),
                        payment processor cookies (to process payments securely and prevent fraud), and social media platform cookies (when you interact with social features).
                    </p>

                    <h2>6. Your Cookie Choices</h2>
                    <p>
                        You have the right to accept or reject cookies. Most web browsers automatically accept cookies, but you
                        can usually modify your browser settings to decline cookies if you prefer. However, blocking cookies may
                        affect the functionality of our Service. When you first visit our website, you will see a cookie consent
                        banner where you can choose which cookies to accept. For specific third-party cookies, you can opt out
                        through their respective privacy policies and opt-out mechanisms.
                    </p>

                    <h2>7. Do Not Track Signals</h2>
                    <p>
                        Some browsers include a "Do Not Track" (DNT) feature that signals to websites you visit that you do not
                        want to have your online activity tracked. Currently, there is no standard for how DNT signals should be
                        interpreted. As a result, we do not currently respond to DNT browser signals or mechanisms.
                    </p>

                    <h2>8. Updates to This Cookie Policy</h2>
                    <p>
                        We may update this Cookie Policy from time to time to reflect changes in our practices or for other
                        operational, legal, or regulatory reasons. Please review this policy periodically for any changes.
                    </p>

                    <p>
                        If you have any questions about our use of cookies, please contact us at <a href="mailto:printdootweb@gmail.com">printdootweb@gmail.com</a>.
                    </p>
                </div>
            </div>
        </DynamicLegalPage>
    );
};

export default Cookies;
