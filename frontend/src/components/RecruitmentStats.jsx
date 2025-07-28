// src/components/RecruitmentStats.jsx
import React from 'react';

function RecruitmentStats() {
    // Data for recruitment statistics
    const stats = [
        {
            value: "5K+",
            label: "Placements",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-indigo-500 w-12 h-12 mb-3 inline-block"
                    viewBox="0 0 24 24"
                >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            ),
        },
        {
            value: "300+",
            label: "Clients",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-indigo-500 w-12 h-12 mb-3 inline-block"
                    viewBox="0 0 24 24"
                >
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4-10h1m-1 4h1"></path>
                </svg>
            ),
        },
        {
            value: "10K+",
            label: "Candidates",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-indigo-500 w-12 h-12 mb-3 inline-block"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 4.5a2.5 2.5 0 00-2.5 2.5v0a2.5 2.5 0 00-2.5 2.5v0a2.5 2.5 0 00-2.5 2.5v2.5a2.5 2.5 0 002.5 2.5h10a2.5 2.5 0 002.5-2.5v-2.5a2.5 2.5 0 00-2.5-2.5v0a2.5 2.5 0 00-2.5-2.5v0a2.5 2.5 0 00-2.5-2.5v0zm-5 5v0zm5 0v0zm5 0v0z"></path>
                </svg>
            ),
        },
        {
            value: "15+",
            label: "Years",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="text-indigo-500 w-12 h-12 mb-3 inline-block"
                    viewBox="0 0 24 24"
                >
                    <path d="M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2zm-1 5h14M9 4v2m6-2v2m-9 5h2m2 0h2m-4 3h2m2 0h2m-4 3h2m2 0h2"></path>
                </svg>
            ),
        },
    ];

    return (
        <section className="text-gray-600 body-font py-12 bg-white">
            <div className="container px-5 py-24 mx-auto">
                {/* Heading and Description */}
                <div className="flex flex-col text-center w-full mb-20">
                    <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
                        Our Recruitment Impact
                    </h1>
                    <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
                        At Career Portal, we pride ourselves on connecting top talent with leading companies. Our proven track record speaks for itself, with thousands of successful placements and a growing network of clients and candidates.
                    </p>
                </div>
                {/* Statistics Grid */}
                <div className="flex flex-wrap -m-4 text-center">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="p-4 md:w-1/4 sm:w-1/2 w-full"
                        >
                            <div className="border-2 border-gray-200 px-4 py-6 rounded-lg">
                                {stat.icon}
                                <h2 className="title-font font-medium text-3xl text-gray-900">
                                    {stat.value}
                                </h2>
                                <p className="leading-relaxed">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default RecruitmentStats;