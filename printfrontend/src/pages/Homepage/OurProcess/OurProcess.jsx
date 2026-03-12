import React, { useState, useEffect, useRef } from 'react';

const steps = [
    {
        number: 1,
        title: "Choose Product",
        description: "Browse our catalog and select the product you want to customize.",
        icon: "🛍️",
    },
    {
        number: 2,
        title: "Upload Design",
        description: "Upload your artwork, logo, or use our design templates.",
        icon: "🎨",
    },
    {
        number: 3,
        title: "Customize",
        description: "Adjust colors, sizes, and placement with our easy editor.",
        icon: "✏️",
    },
    {
        number: 4,
        title: "Production",
        description: "Crafting your order with precision and care.",
        icon: "🏭",
    },
    {
        number: 5,
        title: "Quality Check",
        description: "Every product is inspected to ensure premium quality.",
        icon: "✅",
    },
    {
        number: 6,
        title: "Delivery",
        description: "Fast and secure delivery right to your doorstep.",
        icon: "🚚",
    },
];

const AUTO_CYCLE_MS = 3000;

const OurProcess = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    // Auto-cycle through steps
    useEffect(() => {
        if (isPaused) return;
        timerRef.current = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, AUTO_CYCLE_MS);
        return () => clearInterval(timerRef.current);
    }, [isPaused]);

    const handleStepClick = (index) => {
        setActiveStep(index);
        // Reset timer on manual click
        clearInterval(timerRef.current);
        if (!isPaused) {
            timerRef.current = setInterval(() => {
                setActiveStep((prev) => (prev + 1) % steps.length);
            }, AUTO_CYCLE_MS);
        }
    };

    return (
        <section className="w-full px-4 sm:px-6 py-8 sm:py-14">
            <div className="max-w-6xl mx-auto">
                <div
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className="flex flex-col lg:flex-row">

                        {/* Left: Illustration panel */}
                        <div className="lg:w-[340px] xl:w-[380px] bg-gradient-to-br from-brand-50/50 to-gray-50 flex flex-col items-center justify-center p-8 sm:p-10 rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-2xl shadow-md flex items-center justify-center mb-5 transition-all duration-500">
                                <span className="text-6xl sm:text-7xl transition-all duration-300">
                                    {steps[activeStep].icon}
                                </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-dark text-center">
                                {steps[activeStep].title}
                            </h3>
                        </div>

                        {/* Right: Process content */}
                        <div className="flex-1 p-6 sm:p-10 lg:p-12">
                            {/* Section Title */}
                            <div className="mb-8 sm:mb-10">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl text-dark">
                                    Our <span className="font-bold">Process</span>
                                </h2>
                            </div>

                            {/* Step Timeline */}
                            <div className="flex items-center justify-between mb-8 sm:mb-10 overflow-x-auto py-3 px-1">
                                {steps.map((step, index) => (
                                    <div key={step.number} className="flex items-center flex-shrink-0">
                                        {/* Step circle */}
                                        <button
                                            onClick={() => handleStepClick(index)}
                                            className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer ${index === activeStep
                                                    ? 'bg-brand text-white shadow-md shadow-brand/25 scale-110'
                                                    : index < activeStep
                                                        ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                }`}
                                        >
                                            {step.number}
                                        </button>

                                        {/* Connector line */}
                                        {index < steps.length - 1 && (
                                            <div className={`w-8 sm:w-12 lg:w-16 h-0.5 mx-1 transition-colors duration-300 ${index < activeStep ? 'bg-brand-200' : 'bg-gray-200'
                                                }`}>
                                                <div className="w-full h-full border-t-2 border-dashed border-inherit" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Active Step Details */}
                            <div className="transition-all duration-300">
                                <h3 className="text-xl sm:text-2xl font-bold text-dark mb-2">
                                    {steps[activeStep].title}
                                </h3>
                                <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-md">
                                    {steps[activeStep].description}
                                </p>
                            </div>

                            {/* Our Brochure CTA */}
                            <a
                                href="/contact"
                                className="inline-flex items-center gap-2 mt-6 sm:mt-8 bg-brand text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-500 active:scale-[0.97] transition-all duration-200 text-sm shadow-md shadow-brand/20"
                            >
                                Our Brochure
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default OurProcess;
