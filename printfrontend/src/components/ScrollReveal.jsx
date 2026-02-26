import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollReveal component - Animates children when they scroll into view
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {string} props.direction - Animation direction: 'up', 'down', 'left', 'right', 'fade'
 * @param {number} props.delay - Animation delay in seconds
 * @param {number} props.duration - Animation duration in seconds
 * @param {string} props.className - Additional CSS classes
 */
const ScrollReveal = ({ 
    children, 
    direction = 'up', 
    delay = 0, 
    duration = 0.5,
    className = '',
    threshold = 0.1
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    const getInitialPosition = () => {
        switch (direction) {
            case 'up':
                return { y: 50, opacity: 0 };
            case 'down':
                return { y: -50, opacity: 0 };
            case 'left':
                return { x: 50, opacity: 0 };
            case 'right':
                return { x: -50, opacity: 0 };
            case 'fade':
                return { opacity: 0 };
            default:
                return { y: 50, opacity: 0 };
        }
    };

    const animate = isVisible
        ? { x: 0, y: 0, opacity: 1 }
        : getInitialPosition();

    return (
        <motion.div
            ref={ref}
            initial={getInitialPosition()}
            animate={animate}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94] // Smooth ease-out curve
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default ScrollReveal;
