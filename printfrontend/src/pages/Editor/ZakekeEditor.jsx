import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import catalogService from '../../services/catalogService';
import zakekeService from '../../services/zakekeService';
import { useShop } from '../../context/ShopContext';
import './ZakekeEditor.css';

const ZakekeEditor = () => {
    const { productId } = useParams();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useShop();
    const scriptLoadedRef = useRef(false);

    useEffect(() => {
        const loadScript = () => {
            return new Promise((resolve, reject) => {
                if (scriptLoadedRef.current || window.ZakekeDesigner) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://portal.zakeke.com/scripts/integration/apiV2/customizer.js';
                script.async = true;
                script.onload = () => {
                    scriptLoadedRef.current = true;
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load Zakeke SDK'));
                document.body.appendChild(script);
            });
        };

        const initializeZakeke = async () => {
            try {
                setLoading(true);
                await loadScript();

                // 1. Fetch product details
                const prod = await catalogService.getProductBySlug(productId);
                if (!prod) throw new Error('Product not found');

                // 2. Verify Zakeke product ID exists
                if (!prod.zakeke_product_id) {
                    throw new Error('This product is not linked to Zakeke. Please contact support.');
                }

                // 3. Get Zakeke token (C2S token for frontend)
                const token = await zakekeService.getToken();
                if (!token) {
                    throw new Error('Failed to get Zakeke authentication token. Please try again.');
                }
                console.log('Zakeke Config:', {
                    tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
                    productId: prod.zakeke_product_id,
                    productName: prod.title
                });

                // 4. Setup Config
                // Handle selectedAttributes from URL params (if re-editing)
                const selectedAttributesParam = searchParams.get('selectedAttributes');
                let selectedAttributes = {};
                if (selectedAttributesParam) {
                    try {
                        selectedAttributes = JSON.parse(selectedAttributesParam);
                    } catch (e) {
                        console.error('Failed to parse selectedAttributes:', e);
                    }
                }

                const config = {
                    tokenOauth: token,  // Zakeke requires tokenOauth (not accessToken)
                    productId: String(prod.zakeke_product_id),  // Use Zakeke product ID from database
                    productName: prod.title,
                    quantity: 1,
                    currency: 'INR',
                    culture: 'en-US',
                    targetElement: 'zakeke-container',
                    selectedAttributes: selectedAttributes,
                    designId: searchParams.get('designId') || '',

                    // Callbacks
                    getProductInfo: (zakekeData) => {
                        console.log('Zakeke: getProductInfo', zakekeData);
                        return {
                            price: prod.basePrice || 0,
                            isOutOfStock: false
                        };
                    },
                    getProductPrice: (zakekeData) => {
                        console.log('Zakeke: getProductPrice', zakekeData);
                        const markupPrice = Number(zakekeData.price || 0);
                        const finalPrice = Number(prod.basePrice || 0) + markupPrice;
                        return {
                            price: finalPrice,
                            isOutOfStock: false
                        };
                    },
                    getProductAttribute: () => {
                        console.log('Zakeke: getProductAttribute');
                        return { attributes: [], variants: [] };
                    },
                    addToCart: (zakekeData) => {
                        console.log('Zakeke: addToCart', zakekeData);
                        const { designId, quantity } = zakekeData;
                        addToCart(prod, quantity || 1, designId);
                        window.location.href = '/cart';
                    },
                    onBackClicked: () => {
                        window.history.back();
                    }
                };

                // Validate config before initializing
                if (!config.tokenOauth) {
                    throw new Error('Zakeke token is missing. Please refresh the page.');
                }
                if (!config.productId) {
                    throw new Error('Zakeke product ID is missing.');
                }

                console.log('Initializing Zakeke customizer with config:', {
                    hasToken: !!config.tokenOauth,
                    productId: config.productId,
                    productName: config.productName
                });

                const customizer = new window.ZakekeDesigner();

                // Ensure we don't init twice in StrictMode
                const container = document.getElementById('zakeke-container');
                if (!container) {
                    throw new Error('Zakeke container element not found.');
                }
                if (!container.querySelector('iframe')) {
                    customizer.createIframe(config);
                }

            } catch (err) {
                console.error('Zakeke initialization failed:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        initializeZakeke();
    }, [productId, searchParams]);

    if (error) return (
        <div className="zakeke-error-wrapper">
            <div className="zakeke-error-card">
                <h3>Customization Unavailable</h3>
                <p>{error}</p>
                <button onClick={() => window.history.back()}>Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="zakeke-editor-page">
            {loading && (
                <div className="zakeke-loader-overlay">
                    <div className="zakeke-spinner"></div>
                    <p>Submitting to Creative Studio...</p>
                </div>
            )}
            <div id="zakeke-container" className="zakeke-sdk-target"></div>
        </div>
    );
};

export default ZakekeEditor;
