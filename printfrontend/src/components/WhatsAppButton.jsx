import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

/**
 * WhatsAppButton — Floating WhatsApp chat button (bottom-right).
 * Opens WhatsApp with a pre-filled message to the business number.
 * Hidden on editor pages to avoid interfering with Zakeke controls.
 */
const WhatsAppButton = () => {
    const [visible, setVisible] = useState(false);
    const [tooltip, setTooltip] = useState(true);
    const location = useLocation();

    const PHONE = '917827303575'; // India country code + number
    const MESSAGE = encodeURIComponent('Hi PrintDoot! I have a query regarding your products.');
    const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

    // Hide on editor pages
    const isEditorPage = location.pathname.startsWith('/zakeke-editor') || location.pathname.startsWith('/editor');

    useEffect(() => {
        // Show button after a short delay for smooth entrance
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Auto-hide tooltip after 8 seconds
        if (tooltip) {
            const timer = setTimeout(() => setTooltip(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [tooltip]);

    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-end gap-3 transition-all duration-500 ${
                visible && !isEditorPage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
        >
            {/* Tooltip bubble */}
            {tooltip && (
                <div className="hidden sm:flex items-center gap-2 bg-white rounded-2xl rounded-br-md shadow-xl border border-gray-100 px-4 py-3 max-w-[220px] animate-fadeInUp">
                    <p className="text-[13px] text-gray-700 leading-snug font-medium">
                        Hi there! 👋<br />
                        <span className="text-gray-500 font-normal">Need help? Chat with us on WhatsApp</span>
                    </p>
                    <button
                        onClick={(e) => { e.stopPropagation(); setTooltip(false); }}
                        className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close tooltip"
                    >
                        <IoClose className="text-sm" />
                    </button>
                </div>
            )}

            {/* WhatsApp button */}
            <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="group relative w-[60px] h-[60px] bg-[#25D366] rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
            >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
                <FaWhatsapp className="text-white text-[28px] relative z-10" />
            </a>
        </div>
    );
};

export default WhatsAppButton;
