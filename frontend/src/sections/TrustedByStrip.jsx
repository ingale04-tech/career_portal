// src/components/TrustedByStrip.jsx
import React from 'react';

function TrustedByStrip() {
    // Array of image URLs (placeholders for company logos)
    const logos = [
        'https://clustorcomputing.com/assets/images/partner/style2/3.png',
        'https://clustorcomputing.com/assets/images/partner/style2/4.png',
        'https://clustorcomputing.com/assets/images/partner/style2/2.png',
        'https://clustorcomputing.com/assets/images/partner/style2/4.png',
        'https://clustorcomputing.com/assets/images/partner/style2/5.png',
        'https://clustorcomputing.com/assets/images/partner/style2/6.png',
        'https://clustorcomputing.com/assets/images/partner/style2/1.png',
        'https://clustorcomputing.com/assets/images/partner/style2/7.png',
        'https://clustorcomputing.com/assets/images/partner/style2/8.png',
    ];

    // Duplicate the logos array to create a seamless loop
    const duplicatedLogos = [...logos, ...logos];

    return (
        <div className="w-full py-8 bg-gray-100">
            {/* Container with borders */}
            <div className="border-t-2 border-b-2 border-gray-300 py-6">
                {/* Centered "Trusted By" text */}
                <h2 className="text-center text-2xl font-semibold text-gray-800 mb-4">
                    Trusted By
                </h2>
                {/* Animation strip */}
                <div className="overflow-hidden">
                    <div className="flex animate-scroll">
                        {duplicatedLogos.map((logo, index) => (
                            <img
                                key={index}
                                src={logo}
                                alt={`Company ${index % logos.length + 1} Logo`}
                                className="h-12 mx-6"
                            />
                        ))}
                    </div>
                </div>
            </div>
            {/* Custom CSS for the animation */}
            <style>
                {`
                    @keyframes scroll {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-50%);
                        }
                    }
                    .animate-scroll {
                        animation: scroll 20s linear infinite;
                        white-space: nowrap;
                    }
                    .animate-scroll:hover {
                        animation-play-state: paused;
                    }
                `}
            </style>
        </div>
    );
}

export default TrustedByStrip;