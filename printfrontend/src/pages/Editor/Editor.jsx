import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiHook from "../../services/apiConfig";

export default function Editor() {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                setLoading(true);
                // Using apiHook directly for simplicity in this mockup, 
                // normally would add to catalogService
                const response = await apiHook.get(`/templates/${templateId}/`);
                setTemplate(response.data);
            } catch (error) {
                console.error("Failed to load template", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplate();
    }, [templateId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    if (!template) {
        return <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">Template not found.</div>;
    }

    // Calculate canvas dimensions based on specs (scale for preview)
    const spec = template.print_spec_details || {}; // We might need to ensure this is serialized
    const mmToPx = 5; // Scale: 1mm = 5px for editor view
    const canvasWidth = (template.width_mm || 89) * mmToPx;
    const canvasHeight = (template.height_mm || 51) * mmToPx;

    return (
        <div className="h-screen bg-gray-900 flex flex-col text-white overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="hover:bg-gray-700 p-2 rounded-lg">←</button>
                    <h1 className="font-bold text-lg">{template.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium">Save Draft</button>
                    <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-sm font-bold">Review & Buy</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 gap-8 shrink-0">
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-blue-400">
                        <span className="text-2xl">T</span>
                        <span className="text-[10px] font-bold uppercase">Text</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-blue-400">
                        <span className="text-2xl">🖼️</span>
                        <span className="text-[10px] font-bold uppercase">Image</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-blue-400">
                        <span className="text-2xl">📐</span>
                        <span className="text-[10px] font-bold uppercase">Shapes</span>
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 bg-gray-950 relative flex items-center justify-center overflow-auto p-20">
                    {/* Mockup Container */}
                    <div className="relative shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                        {/* The Product Mockup Image */}
                        <img
                            src="https://placehold.co/1200x800/111/444?text=Product+Mockup+(Visiting+Card+Front)"
                            alt="Mockup"
                            className="max-w-none w-[1000px] rounded-lg"
                        />

                        {/* The Editor Canvas (Overlaid using x_percent / y_percent) */}
                        <div
                            style={{
                                position: 'absolute',
                                left: `${template.x_percent || 50}%`,
                                top: `${template.y_percent || 50}%`,
                                width: `${canvasWidth}px`,
                                height: `${canvasHeight}px`,
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'white',
                                boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                                overflow: 'hidden'
                            }}
                            className="group"
                        >
                            {/* Bleed/Safe Zone Overlays (Visual guide) */}
                            <div className="absolute inset-0 border border-dashed border-red-300 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            {/* Template Elements */}
                            {template.elements && template.elements.map((el) => (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${el.x_percent}%`,
                                        top: `${el.y_percent}%`,
                                        transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                                        color: el.color || '#000',
                                        fontSize: `${el.font_size}px`,
                                        fontFamily: el.font_family || 'sans-serif',
                                        whiteSpace: 'nowrap',
                                        cursor: 'move',
                                        maxWidth: `${el.max_width_percent}%`,
                                        userSelect: 'none'
                                    }}
                                    className="hover:outline hover:outline-2 hover:outline-blue-500 hover:outline-offset-4"
                                >
                                    {el.type === 'text' ? el.default_text : 'Image Placeholder'}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips Overlay */}
                    <div className="absolute bottom-10 left-10 bg-gray-800/80 backdrop-blur p-4 rounded-xl border border-gray-700 max-w-xs transition-opacity hover:opacity-10 border-l-4 border-l-blue-500">
                        <h4 className="font-bold text-sm mb-1">Editor Tip</h4>
                        <p className="text-xs text-gray-400">The white area is your printable canvas. Everything inside is exactly what will be printed.</p>
                    </div>
                </div>

                {/* Right Sidebar (Properties) */}
                <div className="w-72 bg-gray-800 border-l border-gray-700 p-6 shrink-0">
                    <h2 className="font-bold mb-6 text-sm uppercase tracking-widest text-gray-400">Properties</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">CANVAS SIZE</label>
                            <div className="bg-gray-900 p-3 rounded-lg text-sm">
                                {template.width_mm}mm x {template.height_mm}mm
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">SURFACE</label>
                            <div className="bg-gray-900 p-3 rounded-lg text-sm capitalize">
                                {template.surface} Side
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
