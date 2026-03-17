import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './FilterDropdown.css';

/**
 * Reusable dropdown filter pill component.
 * Renders a teal pill that opens a dropdown menu on click.
 *
 * @param {string}   value     - Currently selected value
 * @param {string[]} options   - All available options
 * @param {function} onChange  - Called with the new value when user picks an option
 * @param {string}   [className] - Extra className for the wrapper
 */
const FilterDropdown = ({ value, options, onChange, className = '' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={`fd-wrapper ${className}`} ref={ref}>
            <button
                type="button"
                className={`fd-pill ${open ? 'fd-pill-open' : ''}`}
                onClick={() => setOpen(o => !o)}
            >
                {value} <ChevronDown size={14} className={`fd-chevron ${open ? 'fd-chevron-up' : ''}`} />
            </button>

            {open && (
                <div className="fd-menu">
                    {options.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            className={`fd-option ${opt === value ? 'fd-option-active' : ''}`}
                            onClick={() => { onChange(opt); setOpen(false); }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FilterDropdown;
