// src/components/OurTeam.jsx
import React from 'react';

function OurTeam() {
    // Dummy data for team members
    const teamMembers = [
        {
            name: "Holden Caulfield",
            role: "UI Designer",
            image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=80&auto=format&fit=crop",
        },
        {
            name: "Henry Letham",
            role: "CTO",
            image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=84&auto=format&fit=crop",
        },
        {
            name: "Oskar Blinde",
            role: "Founder",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=88&auto=format&fit=crop",
        },
        {
            name: "John Doe",
            role: "DevOps",
            image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=90&auto=format&fit=crop",
        },
        {
            name: "Martin Eden",
            role: "Software Engineer",
            image: "https://i.pinimg.com/236x/c1/c2/5e/c1c25eeb441792159f821a041ae016e8.jpg",
        },
        {
            name: "Boris Kitua",
            role: "UX Researcher",
            image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=98&auto=format&fit=crop",
        },
        {
            name: "Atticus Finch",
            role: "QA Engineer",
            image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
        },
        {
            name: "Alper Kamu",
            role: "System Administrator",
            image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=104&auto=format&fit=crop",
        },
        {
            name: "Rodrigo Monchi",
            role: "Product Manager",
            image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=108&auto=format&fit=crop",
        },
    ];

    return (
        <section className="text-gray-600 body-font py-12 bg-white">
            <div className="container px-5 py-24 mx-auto">
                {/* Heading and Description */}
                <div className="flex flex-col text-center w-full mb-20">
                    <h1 className="sm:text-3xl text-2xl font-medium title-font mb-4 text-gray-900">
                        Our Team
                    </h1>
                    <p className="lg:w-2/3 mx-auto leading-relaxed text-base">
                        Meet the dedicated professionals behind Career Portal. Our team is passionate about connecting talent with opportunity, ensuring a seamless recruitment experience for both employers and job seekers.
                    </p>
                </div>
                {/* Team Members Grid */}
                <div className="flex flex-wrap -m-2">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            className="p-2 lg:w-1/3 md:w-1/2 w-full"
                        >
                            <div className="h-full flex items-center border-gray-200 border p-4 rounded-lg">
                                <img
                                    alt={`${member.name} - ${member.role}`}
                                    className="w-16 h-16 bg-gray-100 object-cover object-center flex-shrink-0 rounded-full mr-4"
                                    src={member.image}
                                />
                                <div className="flex-grow">
                                    <h2 className="text-gray-900 title-font font-medium">
                                        {member.name}
                                    </h2>
                                    <p className="text-gray-500">{member.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default OurTeam;