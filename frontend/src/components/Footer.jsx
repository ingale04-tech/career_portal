// src/components/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Footer() {
    // State for email input and response messages
    const [email, setEmail] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Data for footer categories
    const categories = [
        {
            title: "For Job Seekers",
            links: [
                { label: "Browse Jobs", to: "/jobs" },
                { label: "Register as Applicant", to: "/register/applicant" },
                { label: "Career Tips", to: "/resources/career-tips" },
                { label: "Resume Builder", to: "/resources/resume-builder" },
            ],
        },
        {
            title: "For Employers",
            links: [
                { label: "Post a Job", to: "/hr" },
                { label: "Register as HR", to: "/register/hr" },
                { label: "View Applicants", to: "/applicants" },
                { label: "Hiring Solutions", to: "/solutions" },
            ],
        },
        {
            title: "Resources",
            links: [
                { label: "About Us", to: "/about" },
                { label: "Blog", to: "/blog" },
                { label: "FAQ", to: "/faq" },
                // Removed Contact Us link since the /contact route was removed
            ],
        },
    ];

    // Handle form submission
    const handleSubscribe = async (e) => {
        e.preventDefault();

        // Basic email validation
        if (!email) {
            setResponseMessage('Please enter an email address.');
            setIsError(true);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setResponseMessage('Please enter a valid email address.');
            setIsError(true);
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/subscribe', {
                email,
            });
            console.log('Subscription response:', response.data);
            setResponseMessage(response.data.message || 'Subscribed successfully!');
            setIsError(false);
            setEmail(''); // Clear the input field
        } catch (error) {
            console.error('Error subscribing:', error.response || error);
            setResponseMessage(
                error.response?.data?.error || 'Failed to subscribe. Please try again later.'
            );
            setIsError(true);
        }
    };

    return (
        <footer className="text-gray-600 body-font">
            <div className="container px-5 py-24 mx-auto">
                <div className="flex flex-wrap md:text-left text-center order-first">
                    {/* Categories */}
                    {categories.map((category, index) => (
                        <div
                            key={index}
                            className="lg:w-1/4 md:w-1/2 w-full px-4"
                        >
                            <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-3">
                                {category.title.toUpperCase()}
                            </h2>
                            <nav className="list-none mb-10">
                                {category.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <Link
                                            to={link.to}
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </nav>
                        </div>
                    ))}
                    {/* Subscription Section */}
                    <div className="lg:w-1/4 md:w-1/2 w-full px-4">
                        <h2 className="title-font font-medium text-gray-900 tracking-widest text-sm mb-3">
                            SUBSCRIBE
                        </h2>
                        <form onSubmit={handleSubscribe}>
                            <div className="flex xl:flex-nowrap md:flex-nowrap lg:flex-wrap flex-wrap justify-center items-end md:justify-start">
                                <div className="relative w-40 sm:w-auto xl:mr-4 lg:mr-0 sm:mr-4 mr-2">
                                    <label
                                        htmlFor="footer-field"
                                        className="leading-7 text-sm text-gray-600"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="footer-field"
                                        name="footer-field"
                                        className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:bg-transparent focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="lg:mt-2 xl:mt-0 flex-shrink-0 inline-flex text-white bg-blue-500 border-0 py-2 px-6 focus:outline-none hover:bg-green-500 rounded"
                                >
                                    Subscribe
                                </button>
                            </div>
                            <p className="text-gray-500 text-sm mt-2 md:text-left text-center">
                                Stay updated with the latest job opportunities and
                                <br className="lg:block hidden" />
                                recruiting tips.
                            </p>
                            {responseMessage && (
                                <p
                                    className={`text-sm mt-2 md:text-left text-center ${
                                        isError ? 'text-red-500' : 'text-green-500'
                                    }`}
                                >
                                    {responseMessage}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
            {/* Bottom Section */}
            <div className="bg-gray-100">
                <div className="container px-5 py-6 mx-auto flex items-center sm:flex-row flex-col">
                    {/* Branding */}
                    <Link
                        to="/"
                        className="flex title-font font-medium items-center md:justify-start justify-center text-gray-900"
                    >
                        <img
                            src="https://www.kavaavi.com/assets/images/logo.png"
                            alt="Career Portal Logo"
                            className="w-10 h-10 rounded-full object-contain"
                        />
                        <span className="ml-3 text-xl">Career Portal</span>
                    </Link>
                    <p className="text-sm text-gray-500 sm:ml-6 sm:mt-0 mt-4">
                        © {new Date().getFullYear()} Career Portal —
                        <a
                            href="https://twitter.com"
                            rel="noopener noreferrer"
                            className="text-gray-600 ml-1"
                            target="_blank"
                        >
                            @careerportal
                        </a>
                    </p>
                    {/* Social Media Links */}
                    <span className="inline-flex sm:ml-auto sm:mt-0 mt-4 justify-center sm:justify-start">
                        <a
                            href="https://facebook.com"
                            className="text-gray-500"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg
                                fill="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                            >
                                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                            </svg>
                        </a>
                        <a
                            href="https://twitter.com"
                            className="ml-3 text-gray-500"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg
                                fill="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                            >
                                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                            </svg>
                        </a>
                        <a
                            href="https://instagram.com"
                            className="ml-3 text-gray-500"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                            >
                                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
                            </svg>
                        </a>
                        <a
                            href="https://linkedin.com/company/careerportal"
                            className="ml-3 text-gray-500"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg
                                fill="currentColor"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="0"
                                className="w-5 h-5"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    stroke="none"
                                    d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"
                                ></path>
                                <circle cx="4" cy="4" r="2" stroke="none"></circle>
                            </svg>
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;