import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import catalogService from '../../services/catalogService';
import zakekeService from '../../services/zakekeService';
import designService from '../../services/designService';
import { useShop } from '../../context/ShopContext';
import './ZakekeEditor.css';

const ZakekeEditor = () => {
    const { productId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
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
                        return {
                            price: prod.basePrice || 0,
                            isOutOfStock: false
                        };
                    },
                    getProductPrice: (zakekeData) => {
                        const markupPrice = Number(zakekeData.price || 0);
                        const finalPrice = Number(prod.basePrice || 0) + markupPrice;
                        return {
                            price: finalPrice,
                            isOutOfStock: false
                        };
                    },
                    getProductAttribute: () => {
                        return { attributes: [], variants: [] };
                    },
                    addToCart: (zakekeData) => {
                        console.log('[Zakeke addToCart] Full callback data:', JSON.stringify(zakekeData, null, 2));
                        
                        // Zakeke sends all-lowercase keys: designid, productid, quantity
                        const designId = zakekeData.designid || zakekeData.designID || zakekeData.designId || zakekeData.design_id || '';
                        const qty = zakekeData.quantity || 1;
                        
                        console.log('[Zakeke addToCart] Extracted designId:', designId, '| quantity:', qty);
                        
                        if (!designId) {
                            console.error('[Zakeke addToCart] WARNING: No designId found in callback data!');
                        }
                        
                        // 1. Add to cart FIRST (synchronous)
                        addToCart(prod, qty, designId);
                        
                        // 2. Save to localStorage SYNCHRONOUSLY (before navigate kills the component)
                        if (designId) {
                            try {
                                const localDesigns = JSON.parse(localStorage.getItem('zakeke_designs') || '[]');
                                localDesigns.push({
                                    designId,
                                    productId: prod.id,
                                    productTitle: prod.title || prod.name,
                                    productSlug: prod.slug,
                                    productImage: prod.primary_image || prod.image || '',
                                    previewUrl: '',
                                    createdAt: new Date().toISOString(),
                                });
                                localStorage.setItem('zakeke_designs', JSON.stringify(localDesigns));
                                console.log('[Zakeke] Design saved to localStorage');
                            } catch (e) {
                                console.warn('[Zakeke] localStorage save failed:', e);
                            }
                        }
                        
                        // 3. Navigate to cart
                        navigate('/cart');
                        
                        // 4. Fire-and-forget: save to backend + fetch preview URL
                        if (designId) {
                            (async () => {
                                try {
                                    const details = await zakekeService.getDesignDetails(designId);
                                    const previewUrl = details?.tempPreviewImageUrl || '';
                                    
                                    // Update localStorage with preview URL
                                    if (previewUrl) {
                                        const stored = JSON.parse(localStorage.getItem('zakeke_designs') || '[]');
                                        const last = stored[stored.length - 1];
                                        if (last && last.designId === designId) {
                                            last.previewUrl = previewUrl;
                                            localStorage.setItem('zakeke_designs', JSON.stringify(stored));
                                        }
                                    }
                                    
                                    // Save to backend (only works if logged in)
                                    await designService.createDesign({
                                        product: prod.id,
                                        name: `${prod.title || 'Custom'} Design`,
                                        zakeke_design_id: designId,
                                        preview_url: previewUrl,
                                        design_json: { 
                                            zakeke_design_id: designId, 
                                            preview_url: previewUrl,
                                            created_via: 'zakeke_editor'
                                        },
                                        tags: ['zakeke'],
                                    });
                                    console.log('[Zakeke] Design saved to backend');
                                } catch (err) {
                                    console.warn('[Zakeke] Backend save (non-blocking):', err);
                                }
                            })();
                        }
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
