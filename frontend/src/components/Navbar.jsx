import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ isLoggedIn, role, isApproved, handleLogout }) {
    const [isOpen, setIsOpen] = useState(false);

    // Debug logging to verify props
    console.log('Navbar props:', { isLoggedIn, role, isApproved });

    return (
        <header className="text-gray-600 bg-white shadow-md">
            <div className="container mx-auto flex flex-wrap p-4 items-center justify-between">
                <Link to="/" className="flex font-medium items-center text-gray-900">
                    <img
                        src="https://www.kavaavi.com/assets/images/logo.png"
                        alt="Career Portal Logo"
                        className="w-15 h-10"
                        onError={(e) => {
                            e.target.src = '/fallback-logo.png';
                            console.error('Failed to load logo');
                        }}
                    />
                    <span className="ml-2 text-lg">Career Portal</span>
                </Link>
                <button
                    className="md:hidden flex items-center text-gray-900"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                        />
                    </svg>
                </button>
                <nav
                    className={`${isOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center text-base w-full md:w-auto mt-4 md:mt-0 md:ml-auto space-y-4 md:space-y-0 md:space-x-4`}
                >
                    <Link
                        to="/"
                        className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                        onClick={() => setIsOpen(false)}
                    >
                        Home
                    </Link>
                    <Link
                        to="/jobs"
                        className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                        onClick={() => setIsOpen(false)}
                    >
                        Jobs
                    </Link>
                    {isLoggedIn && isApproved ? (
                        <>
                            {role === 'ROLE_SUPER_ADMIN' && (
                                <Link
                                    to="/super-admin"
                                    className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Super Admin Dashboard
                                </Link>
                            )}
                            {role === 'ROLE_HR' && (
                                <Link
                                    to="/hr"
                                    className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                                    onClick={() => setIsOpen(false)}
                                >
                                    HR Dashboard
                                </Link>
                            )}
                            {role === 'ROLE_APPLICANT' && (
                                <Link
                                    to="/applicant"
                                    className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Applicant Dashboard
                                </Link>
                            )}
                            {role === 'ROLE_HR' && isApproved && (
                                <Link
                                    to="/applicants"
                                    className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Applicants
                                </Link>
                            )}
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsOpen(false);
                                }}
                                className="w-full md:w-auto text-center bg-gray-100 border-0 py-2 px-4 text-lg font-medium text-gray-900 hover:bg-red-500 hover:text-white rounded"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/applicant-options"
                                className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                                onClick={() => setIsOpen(false)}
                            >
                                Applicant
                            </Link>
                            <Link
                                to="/hr-options"
                                className="block text-center py-2 px-2 text-lg font-medium text-gray-900 hover:text-gray-900"
                                onClick={() => setIsOpen(false)}
                            >
                                HR
                            </Link>
                            <Link
                                to="/login"
                                className="w-full md:w-auto flex items-center justify-center bg-blue-500 border-0 py-2 px-4 text-lg font-medium text-black hover:bg-green-500 hover:text-white rounded"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Navbar;