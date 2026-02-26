import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

/**
 * BackToTop — Floating button that appears after scrolling down,
 * and smoothly scrolls back to the top when clicked.
 */
const BackToTop = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className={`fixed bottom-6 right-6 z-50 bg-black text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-800 hover:scale-110 active:scale-95 ${
                visible
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
        >
            <FaArrowUp className="text-sm" />
        </button>
    );
};

export default BackToTop;
