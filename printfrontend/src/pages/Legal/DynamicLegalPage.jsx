import React, { useState, useEffect } from 'react';
import pageService from '../../services/pageService';
import ScrollReveal from '../../components/ScrollReveal';
import './Legal.css';

/**
 * DynamicLegalPage — fetches content from the backend API.
 * If content exists in the admin, it renders the HTML from the API.
 * Otherwise, it renders the fallback children (existing hardcoded content).
 *
 * Usage:
 *   <DynamicLegalPage pageType="privacy" title="Privacy Policy" icon={<FaLock />}>
 *     {/* hardcoded fallback content * /}
 *   </DynamicLegalPage>
 */
const DynamicLegalPage = ({ pageType, title, icon, children }) => {
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [useApi, setUseApi] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const data = await pageService.getPageByType(pageType);
                if (data && data.content) {
                    setPage(data);
                    setUseApi(true);
                }
            } catch (err) {
                // API unavailable or page not found — use fallback
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [pageType]);

    if (loading) {
        return (
            <div className="legal-page">
                <div className="legal-container">
                    <div className="flex justify-center items-center py-32">
                        <div className="w-8 h-8 border-3 border-gray-200 border-t-brand rounded-full animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    // If API has content, render it
    if (useApi && page) {
        return (
            <div className="legal-page">
                <div className="legal-container">
                    <ScrollReveal direction="down" delay={0.1}>
                        <div className="legal-hero">
                            {icon && <div className="hero-icon">{icon}</div>}
                            <h1>{page.title}</h1>
                            <p>Last updated: {new Date(page.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={0.2}>
                        <div
                            className="legal-api-content prose prose-gray max-w-none"
                            dangerouslySetInnerHTML={{ __html: page.content }}
                        />
                    </ScrollReveal>

                    <ScrollReveal direction="up" delay={0.3}>
                        <div className="legal-contact">
                            <h3>Have Questions?</h3>
                            <p>If you have any questions about this page, please get in touch.</p>
                            <a href="/contact" className="btn-primary">Contact Us</a>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        );
    }

    // Fallback: render the hardcoded children
    return <>{children}</>;
};

export default DynamicLegalPage;
