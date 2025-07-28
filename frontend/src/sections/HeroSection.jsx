// src/sections/HeroSection.jsx
import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <section className="relative bg-gradient-to-r from-blue-600 to-teal-500 text-white h-screen flex items-center justify-center">
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black opacity-30"></div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 sm:px-8">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 animate-fade-in">
                    Discover Your Dream Job
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mb-8 animate-fade-in-delayed">
                    Connect with top employers and take the next step in your career with Career Portal.
                </p>
                <Link
                    to="/login"
                    className="inline-block bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition duration-300 animate-fade-in-delayed"
                >
                    Get Started
                </Link>
            </div>

            {/* CSS Animations */}
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fadeIn 1s ease-out;
                    }
                    .animate-fade-in-delayed {
                        animation: fadeIn 1s ease-out 0.5s;
                        animation-fill-mode: both;
                    }
                `}
            </style>
        </section>
    );
};

export default HeroSection;