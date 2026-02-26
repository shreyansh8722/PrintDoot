import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import catalogService from "../../services/catalogService";

export default function TemplateSelection() {
    const { slug } = useParams();
    const [product, setProduct] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const productData = await catalogService.getProductBySlug(slug);
                if (productData) {
                    setProduct(productData);
                    // Fetch templates for this product
                    const templateData = await catalogService.getTemplates({ product: productData.id });
                    setTemplates(templateData);
                }
            } catch (error) {
                console.error("Failed to load templates", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Product not found.</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <nav className="text-sm text-gray-500 mb-4">
                        <Link to="/" className="hover:underline">Home</Link>
                        {" > "}
                        <Link to={`/product/${product.slug}`} className="hover:underline">{product.title}</Link>
                        {" > "}
                        <span className="text-gray-900 font-medium">Select a Design</span>
                    </nav>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Choose a Template for your {product.title}</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Pick a starting point for your design. You can customize every detail in the next step.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {templates.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                            >
                                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                    <img
                                        src={template.preview_image || "https://placehold.co/600x400?text=Design+Preview"}
                                        alt={template.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Link
                                            to={`/editor/${template.id}`}
                                            className="bg-white text-black font-bold py-3 px-8 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                                        >
                                            Use this Design
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4">{template.description || "Fully customizable layout."}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{template.surface} Side</span>
                                        <Link to={`/editor/${template.id}`} className="text-black font-bold text-sm hover:underline">Customize →</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-6">🎨</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No templates found</h2>
                        <p className="text-gray-500 mb-8">We haven't added templates for this product yet. You can start from scratch.</p>
                        <button className="bg-black text-white font-bold py-4 px-10 rounded-full hover:shadow-lg transition-all">
                            Start from Empty Canvas
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
