// frontend/src/App.jsx
import { useEffect, useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './components/Login';
import SuperAdmin from './components/SuperAdmin';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ApplicantOptions from './components/ApplicantOptions';
import HrOptions from './components/HrOptions';
import ApplicantRegister from './components/ApplicantRegister';
import HrRegister from './components/HrRegister';
import TrustedByStrip from './sections/TrustedByStrip';
import AboutUsSection from './components/AboutUsSection';
import RecruitmentStats from './components/RecruitmentStats';
import RecruitmentSteps from './components/RecruitmentSteps';
import OurTeam from './components/OurTeam';
import AboutUsPage from './pages/AboutUsPage';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import JobForm from './components/JobForm'; // Maps to CreateJobForm.jsx
import HrDashboard from './pages/HrDashboard';
import Applicants from './pages/Applicants';
import ApplicantDashboard from './pages/ApplicantDashboard';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [role, setRole] = useState(null);
    const [isApproved, setIsApproved] = useState(false);
    const navigate = useNavigate();

    // Function to update state based on token
    const updateAuthState = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log('Decoded token in App.jsx:', decoded);
                // Check token expiration
                const currentTime = Date.now() / 1000; // Current time in seconds
                if (decoded.exp < currentTime) {
                    console.log('Token is expired, logging out');
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    setRole(null);
                    setIsApproved(false);
                    navigate('/login');
                    return;
                }
                setRole(decoded.roles[0]);
                setIsApproved(decoded.approved);
                setIsLoggedIn(true);
            } catch (error) {
                console.error('Token decoding failed in App.jsx:', error.message);
                localStorage.removeItem('token');
                setRole(null);
                setIsApproved(false);
                setIsLoggedIn(false);
                navigate('/login');
            }
        } else {
            setRole(null);
            setIsApproved(false);
            setIsLoggedIn(false);
        }
    };

    useEffect(() => {
        // Initial check on mount
        updateAuthState();

        // Listen for storage events (e.g., token added/removed in another tab)
        const handleStorageChange = () => {
            console.log('Storage event triggered');
            updateAuthState();
        };

        // Listen for focus events (e.g., user returns to tab)
        const handleFocus = () => {
            console.log('Window focus event triggered');
            updateAuthState();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [navigate]);

    // Log state changes for debugging
    useEffect(() => {
        console.log('App.jsx state updated - isLoggedIn:', isLoggedIn, 'role:', role, 'isApproved:', isApproved);
    }, [isLoggedIn, role, isApproved]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setRole(null);
        setIsApproved(false);
        navigate('/');
    };

    const getDashboardPath = () => {
        if (role === 'ROLE_SUPER_ADMIN' && isApproved) return '/super-admin';
        if (role === 'ROLE_HR' && isApproved) return '/hr';
        if (role === 'ROLE_APPLICANT' && isApproved) return '/applicant';
        return '/login';
    };

    return (
        <div>
            <Navbar
                isLoggedIn={isLoggedIn}
                role={role}
                isApproved={isApproved}
                handleLogout={handleLogout}
            />
            <Routes>
                <Route
                    path="/"
                    element={
                        <>
                            <main
                                className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 sm:p-8"
                                style={{
                                    backgroundImage: `url('https://images.unsplash.com/photo-1563461660947-507ef49e9c47?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                                }}
                            >
                                <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 sm:p-8 bg-opacity-90 flex flex-col items-center">
                                    <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">
                                        Welcome to KaVaaVi Career Portal
                                    </h1>
                                    {isLoggedIn && isApproved ? (
                                        <div className="flex flex-col items-center space-y-4">
                                            <p className="text-gray-600">
                                                You are logged in as {role === 'ROLE_HR' ? 'HR' : role === 'ROLE_APPLICANT' ? 'Applicant' : 'Super Admin'}.
                                            </p>
                                            <Link
                                                to={getDashboardPath()}
                                                className="w-full md:w-auto flex items-center justify-center bg-blue-500 border-0 py-2 px-4 hover:bg-green-500 hover:text-white rounded"
                                            >
                                                Go to Dashboard
                                            </Link>
                                        </div>
                                    ) : (
                                        <Link
                                            to="/login"
                                            className="w-full md:w-auto flex items-center justify-center bg-blue-500 border-0 py-2 px-4 hover:bg-green-500 hover:text-white rounded"
                                        >
                                            Get Started
                                        </Link>
                                    )}
                                </div>
                            </main>
                            <TrustedByStrip />
                            <AboutUsSection />
                            <RecruitmentSteps />
                            <OurTeam />
                            <RecruitmentStats />
                        </>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <Login
                            setIsLoggedIn={setIsLoggedIn}
                            setRole={setRole}
                            setIsApproved={setIsApproved}
                        />
                    }
                />
                <Route
                    path="/super-admin"
                    element={
                        isLoggedIn && role === 'ROLE_SUPER_ADMIN' && isApproved ? (
                            <SuperAdmin />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/applicant-options" element={<ApplicantOptions />} />
                <Route path="/hr-options" element={<HrOptions />} />
                <Route path="/register/applicant" element={<ApplicantRegister />} />
                <Route path="/register/hr" element={<HrRegister />} />
                <Route
                    path="/jobs"
                    element={<Jobs isLoggedIn={isLoggedIn} role={role} />}
                />
                <Route
                    path="/jobs/:id"
                    element={
                        isLoggedIn && role === 'ROLE_APPLICANT' && isApproved ? (
                            <JobDetails />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/applicants"
                    element={
                        isLoggedIn && (role === 'ROLE_HR' || role === 'ROLE_SUPER_ADMIN') && isApproved ? (
                            <Applicants />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/hr"
                    element={
                        isLoggedIn && role === 'ROLE_HR' && isApproved ? (
                            <HrDashboard />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/hr/create-job"
                    element={
                        isLoggedIn && role === 'ROLE_HR' && isApproved ? (
                            <JobForm />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/applicant"
                    element={
                        (() => {
                            const token = localStorage.getItem('token');
                            console.log('Accessing /applicant route:', {
                                isLoggedIn,
                                role,
                                isApproved,
                                tokenExists: !!token,
                                token,
                            });
                            if (!isLoggedIn) {
                                console.log('Redirecting to /login: User not logged in');
                                return <Navigate to="/login" />;
                            }
                            if (role !== 'ROLE_APPLICANT') {
                                console.log('Redirecting to /login: User role is not ROLE_APPLICANT');
                                return <Navigate to="/login" />;
                            }
                            if (!isApproved) {
                                console.log('Redirecting to /login: User not approved');
                                return <Navigate to="/login" />;
                            }
                            if (!token) {
                                console.log('Redirecting to /login: No token found');
                                return <Navigate to="/login" />;
                            }
                            return <ApplicantDashboard token={token} />;
                        })()
                    }
                />
                <Route path="/about" element={<AboutUsPage />} />
            </Routes>
            <Footer />
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
}

export default App;