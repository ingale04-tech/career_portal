// src/pages/ContactUsPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

function ContactUsPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });

    const [status, setStatus] = useState({
        loading: false,
        success: false,
        errors: null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: false, errors: null });

        try {
            const response = await axios.post('http://localhost:8080/api/contact', formData);
            setStatus({
                loading: false,
                success: true,
                errors: null,
            });
            setFormData({
                name: '',
                email: '',
                message: '',
            });
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data) {
                setStatus({
                    loading: false,
                    success: false,
                    errors: error.response.data,
                });
            } else {
                setStatus({
                    loading: false,
                    success: false,
                    errors: { general: error.response?.data?.error || 'Failed to send message. Please try again.' },
                });
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <main className="flex-grow">
                <section className="text-gray-600 body-font relative py-12 bg-gray-50">
                    <div className="container px-5 py-24 mx-auto">
                        <div className="flex flex-col text-center w-full mb-12">
                            <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
                                Contact Us
                            </h1>
                            <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
                                Have questions or need assistance? Reach out to us, and we’ll get back to you as soon as possible.
                            </p>
                        </div>
                        <div className="lg:w-1/2 md:w-2/3 mx-auto">
                            <form onSubmit={handleSubmit} className="flex flex-wrap -m-2">
                                <div className="p-2 w-1/2">
                                    <div className="relative">
                                        <label
                                            htmlFor="name"
                                            className="leading-7 text-sm text-gray-600"
                                        >
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                                            required
                                        />
                                        {status.errors?.name && (
                                            <p className="text-red-600 text-sm mt-1">{status.errors.name}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 w-1/2">
                                    <div className="relative">
                                        <label
                                            htmlFor="email"
                                            className="leading-7 text-sm text-gray-600"
                                        >
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                                            required
                                        />
                                        {status.errors?.email && (
                                            <p className="text-red-600 text-sm mt-1">{status.errors.email}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 w-full">
                                    <div className="relative">
                                        <label
                                            htmlFor="message"
                                            className="leading-7 text-sm text-gray-600"
                                        >
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 h-32 text-base outline-none text-gray-700 py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"
                                            required
                                        ></textarea>
                                        {status.errors?.message && (
                                            <p className="text-red-600 text-sm mt-1">{status.errors.message}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-2 w-full">
                                    <button
                                        type="submit"
                                        className="flex mx-auto text-white bg-blue-500 border-0 py-2 px-8 focus:outline-none hover:bg-green-500 rounded text-lg disabled:opacity-50"
                                        disabled={status.loading}
                                    >
                                        {status.loading ? 'Sending...' : 'Send Message'}
                                    </button>
                                </div>
                                <div className="p-2 w-full text-center">
                                    {status.success && (
                                        <p className="text-green-600">
                                            Message sent successfully! We’ll get back to you soon.
                                        </p>
                                    )}
                                    {status.errors?.general && (
                                        <p className="text-red-600">
                                            {status.errors.general}
                                        </p>
                                    )}
                                </div>
                            </form>
                            <div className="p-2 w-full pt-8 mt-8 border-t border-gray-200 text-center">
                                <a href="mailto:support@careerportal.com" className="text-indigo-500">
                                    support@careerportal.com
                                </a>
                                <p className="leading-normal my-5">
                                    49 Smith St.
                                    <br />
                                    Saint Cloud, MN 56301
                                </p>
                                <span className="inline-flex">
                                    <a href="https://facebook.com" className="text-gray-500">
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
                                    <a href="https://twitter.com" className="ml-4 text-gray-500">
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
                                    <a href="https://instagram.com" className="ml-4 text-gray-500">
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
                                    <a href="https://linkedin.com" className="ml-4 text-gray-500">
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
                    </div>
                </section>
            </main>
        </div>
    );
}

export default ContactUsPage;