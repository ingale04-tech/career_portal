    // src/components/AboutUsSection.jsx
    import React from 'react';
    import { Link } from 'react-router-dom';

    function AboutUsSection() {
        return (
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Left Side: Image */}
                        <div className="md:w-1/2">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-100 rounded-l-3xl rounded-r-3xl md:rounded-r-none"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1650784854976-328a9b3c9c55?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                    alt="Person holding a folder"
                                    className="relative w-full h-96 object-cover rounded-l-3xl rounded-r-3xl md:rounded-r-none"
                                />
                            </div>
                        </div>
                        {/* Right Side: Text and Statistics */}
                        <div className="md:w-1/2">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-0.5 bg-gray-400 mr-2"></div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase">About Us</h3>
                            </div>
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                Navigating The Human Resource
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Recruitment services, often provided by specialized agencies or firms, offer
                                organizations assistance in identifying, attracting, and hiring suitable
                                candidates for their job openings. These services can be particularly beneficial
                                for companies that lack the time, resources, or expertise to handle the
                                recruitment process internally. Here’s an overview of the benefits and key features.
                            </p>
                            {/* Statistics Grid */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <p className="text-3xl font-bold text-gray-800">10+</p>
                                    <p className="text-gray-600">Years Experience</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-800">20K</p>
                                    <p className="text-gray-600">Offers</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-800">600+</p>
                                    <p className="text-gray-600">Satisfied Clients</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-800">60+</p>
                                    <p className="text-gray-600">Team Members</p>
                                </div>
                            </div>
                            {/* About Us Button */}
                            <Link
                                to="/about"
                                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 transition"
                            >
                                About Us
                                <svg
                                    className="ml-2 w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    export default AboutUsSection;