// src/components/RecruitmentSteps.jsx
import React from 'react';

function RecruitmentSteps() {
    // Dummy data for recruitment steps
    const steps = [
        {
            number: 1,
            title: "Job Posting & Sourcing",
            description: "We start by posting the job on various platforms and sourcing candidates through our extensive network, ensuring a wide pool of qualified applicants.",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="w-12 h-12"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
            ),
        },
        {
            number: 2,
            title: "Screening & Shortlisting",
            description: "Our team screens applications, conducts initial interviews, and shortlists candidates who best match the job requirements and company culture.",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="w-12 h-12"
                    viewBox="0 0 24 24"
                >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
            ),
        },
        {
            number: 3,
            title: "Interviews & Assessments",
            description: "We coordinate interviews and assessments, ensuring candidates are thoroughly evaluated through technical tests, behavioral interviews, and more.",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="w-12 h-12"
                    viewBox="0 0 24 24"
                >
                    <circle cx="12" cy="5" r="3"></circle>
                    <path d="M12 22V8M5 12H2a10 10 0 0020 0h-3"></path>
                </svg>
            ),
        },
        {
            number: 4,
            title: "Offer & Onboarding",
            description: "Once a candidate is selected, we manage the offer process and assist with onboarding, ensuring a smooth transition into their new role.",
            icon: (
                <svg
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="w-12 h-12"
                    viewBox="0 0 24 24"
                >
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            ),
        },
    ];

    return (
        <section className="text-gray-600 body-font py-12 bg-gray-50">
            {/* Heading */}
            <h2 className="text-center text-3xl font-bold text-gray-800 mb-12">
                We Provide Transparency
            </h2>
            <div className="container px-5 mx-auto flex flex-wrap">
                {steps.map((step, index) => (
                    <div
                        key={step.number}
                        className={`flex relative ${
                            index === steps.length - 1 ? 'pb-10' : 'pb-20'
                        } sm:items-center md:w-2/3 mx-auto`}
                    >
                        {/* Vertical Line */}
                        <div className="h-full w-6 absolute inset-0 flex items-center justify-center">
                            <div className="h-full w-1 bg-gray-200 pointer-events-none"></div>
                        </div>
                        {/* Number Circle */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full mt-10 sm:mt-0 inline-flex items-center justify-center bg-indigo-500 text-white relative z-10 font-medium text-sm">
                            {step.number}
                        </div>
                        {/* Step Content */}
                        <div className="flex-grow md:pl-8 pl-6 flex sm:items-center items-start flex-col sm:flex-row">
                            {/* Icon Circle */}
                            <div className="flex-shrink-0 w-24 h-24 bg-indigo-100 text-indigo-500 rounded-full inline-flex items-center justify-center">
                                {step.icon}
                            </div>
                            {/* Text */}
                            <div className="flex-grow sm:pl-6 mt-6 sm:mt-0">
                                <h2 className="font-medium text-gray-900 mb-1 text-xl">
                                    {step.title}
                                </h2>
                                <p className="leading-relaxed">{step.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default RecruitmentSteps;