// src/pages/AboutUsPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function AboutUsPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Main Content */}
            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-indigo-600 text-white py-20">
                    <div className="container mx-auto px-5 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            About Career Portal
                        </h1>
                        <p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
                            We’re dedicated to connecting talent with opportunity, making the recruitment process seamless for job seekers and employers alike.
                        </p>
                    </div>
                </section>

                {/* Our Story Section */}
                <section className="py-16">
                    <div className="container mx-auto px-5">
                        <h2 className="text-3xl font-semibold text-gray-900 text-center mb-8">
                            Our Story
                        </h2>
                        <div className="flex flex-wrap items-center -mx-4">
                            <div className="w-full md:w-1/2 px-4 mb-8 md:mb-0">
                                <img
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1974&auto=format&fit=crop"
                                    alt="Career Portal Team"
                                    className="rounded-lg shadow-md w-full h-64 object-cover"
                                />
                            </div>
                            <div className="w-full md:w-1/2 px-4">
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    Founded in 2010, Career Portal started with a simple goal: to bridge the gap between talented individuals and forward-thinking companies. Over the years, we’ve grown into a trusted platform, helping thousands of job seekers find their dream roles and enabling employers to build exceptional teams.
                                </p>
                                <p className="text-gray-600 leading-relaxed">
                                    Our journey is driven by a passion for innovation and a commitment to making the hiring process more efficient, transparent, and rewarding for everyone involved.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission & Vision Section */}
                <section className="bg-white py-16">
                    <div className="container mx-auto px-5">
                        <div className="flex flex-wrap -mx-4">
                            <div className="w-full md:w-1/2 px-4 mb-8">
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                    Our Mission
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To empower job seekers and employers by providing a platform that simplifies hiring, connects the right talent with the right opportunities, and fosters growth for both individuals and organizations.
                                </p>
                            </div>
                            <div className="w-full md:w-1/2 px-4 mb-8">
                                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                    Our Vision
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    To be the leading global recruitment platform, where every individual finds a fulfilling career and every company builds a thriving team through technology and a human-centered approach.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className="py-16">
                    <div className="container mx-auto px-5">
                        <h2 className="text-3xl font-semibold text-gray-900 text-center mb-12">
                            What We Offer
                        </h2>
                        <div className="flex flex-wrap -mx-4">
                            <div className="w-full md:w-1/3 px-4 mb-8">
                                <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
                                    <h3 className="text-xl font-medium text-gray-900 mb-3">
                                        Job Seekers
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Browse thousands of job listings, create a standout resume, and access career advice to land your dream job.
                                    </p>
                                    <Link
                                        to="/jobs"
                                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                                    >
                                        Explore Jobs →
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 px-4 mb-8">
                                <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
                                    <h3 className="text-xl font-medium text-gray-900 mb-3">
                                        Employers
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Post jobs, manage applications, and find top talent with our advanced hiring tools.
                                    </p>
                                    <Link
                                        to="/hr"
                                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                                    >
                                        Hire Talent →
                                    </Link>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 px-4 mb-8">
                                <div className="bg-gray-100 p-6 rounded-lg shadow-md text-center">
                                    <h3 className="text-xl font-medium text-gray-900 mb-3">
                                        Resources
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Access our blog, FAQ, and tools like resume builders to support your career journey.
                                    </p>
                                    <Link
                                        to="/resources"
                                        className="text-indigo-500 hover:text-indigo-600 font-medium"
                                    >
                                        Learn More →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="bg-indigo-600 text-white py-12">
                    <div className="container mx-auto px-5 text-center">
                        <h2 className="text-3xl font-semibold mb-4">
                            Join Career Portal Today
                        </h2>
                        <p className="text-lg leading-relaxed max-w-xl mx-auto mb-6">
                            Whether you’re a job seeker or an employer, we’re here to help you succeed. Start your journey with us now!
                        </p>
                        <Link
                            to="/login"
                            className="inline-block bg-white text-indigo-600 font-medium py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AboutUsPage;