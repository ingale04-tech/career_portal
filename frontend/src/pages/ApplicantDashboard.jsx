import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ApplicationList from '../components/ApplicationList';
import ProfileUpdateForm from '../components/ProfileUpdateForm';
import ApplicantDetailsForm from '../components/ApplicantDetailsForm';
import AddSkillForm from '../components/AddSkillForm';

const ApplicantDashboard = ({ token }) => {
    const [userDetails, setUserDetails] = useState(null);
    const [applicantDetails, setApplicantDetails] = useState(null);
    const [showProfileUpdate, setShowProfileUpdate] = useState(false);
    const [showApplicantDetailsForm, setShowApplicantDetailsForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const navigate = useNavigate();

    const fetchUserData = async () => {
        try {
            console.log('ApplicantDashboard received token:', token);
            if (!token) {
                throw new Error('No authentication token provided');
            }

            console.log('Fetching user details from /api/auth/me');
            console.log('Authorization header:', `Bearer ${token}`);
            const userResponse = await axios.get('http://localhost:8080/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('User details response:', userResponse.data);
            setUserDetails(userResponse.data);

            try {
                console.log('Fetching applicant details from /api/applications/applicant-details');
                console.log('Authorization header:', `Bearer ${token}`);
                const applicantResponse = await axios.get('http://localhost:8080/api/applications/applicant-details', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Applicant details response:', applicantResponse.data);
                setApplicantDetails(applicantResponse.data);
            } catch (applicantErr) {
                console.error('Error fetching applicant details:', applicantErr.message);
                console.log('Applicant error details:', {
                    message: applicantErr.message,
                    responseStatus: applicantErr.response?.status,
                    responseData: applicantErr.response?.data,
                    requestHeaders: applicantErr.config?.headers,
                });
                toast.error('Failed to load applicant details. Please update your skills and details.');
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching user data:', err.message);
            console.log('Error details:', {
                message: err.message,
                responseStatus: err.response?.status,
                responseData: err.response?.data,
                requestHeaders: err.config?.headers,
            });
            toast.error('Failed to load user data. Please try again.');
            if (err.response?.status === 401 || err.message === 'No authentication token provided') {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
            setLoading(false);
        }
    };

    const handleViewResume = async () => {
        if (!applicantDetails.resume) {
            toast.error('No resume uploaded. Please upload a resume first.');
            return;
        }

        setDownloading(true);
        try {
            if (!token) {
                toast.error('Authentication token not found. Please log in again.');
                return;
            }

            const response = await axios.get(applicantDetails.resume, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            // Determine the MIME type based on the file extension
            const extension = applicantDetails.resume.split('.').pop().toLowerCase();
            let mimeType;
            switch (extension) {
                case 'pdf':
                    mimeType = 'application/pdf';
                    break;
                case 'doc':
                case 'docx':
                    mimeType = 'application/msword';
                    break;
                default:
                    mimeType = 'application/octet-stream';
            }

            const blob = new Blob([response.data], { type: mimeType });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = applicantDetails.resume.substring(applicantDetails.resume.lastIndexOf('/') + 1);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Resume downloaded successfully!');
        } catch (err) {
            console.error('Error downloading resume:', err);
            if (err.response?.status === 404) {
                toast.error('Resume file not found. Please upload a new resume.');
            } else if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                const errorMessage = err.response?.data?.error || 'Failed to download resume. Please try again.';
                toast.error(errorMessage);
            }
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [navigate, token]);

    const handleApplyToJobs = () => {
        navigate('/jobs');
    };

    const handleSkillAdded = () => {
        fetchUserData();
    };

    const handleProfileUpdate = (updatedData) => {
        setUserDetails(updatedData);
        setShowProfileUpdate(false);
    };

    const handleApplicantDetailsUpdate = () => {
        fetchUserData();
        setShowApplicantDetailsForm(false);
    };

    if (loading) return <div className="text-center mt-10 text-gray-700">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-6 max-w-4xl">
                <h1 className="text-3xl font-bold text-blue-800 text-center uppercase mb-8">
                    Applicant Dashboard
                </h1>

                {/* Profile Overview */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile Overview</h2>
                    {userDetails && (
                        <div className="space-y-3">
                            <p className="text-gray-700">
                                <strong className="font-medium">Full Name:</strong> {userDetails.fullName}
                            </p>
                            <p className="text-gray-700">
                                <strong className="font-medium">Email:</strong> {userDetails.email}
                            </p>
                            <p className="text-gray-700">
                                <strong className="font-medium">Phone:</strong> {userDetails.phone || 'Not provided'}
                            </p>
                        </div>
                    )}
                    {applicantDetails ? (
                        <div className="space-y-3 mt-4">
                            <p className="text-gray-700">
                                <strong className="font-medium">Primary Skill:</strong> {applicantDetails.primarySkill || 'Not set'}
                            </p>
                            {applicantDetails.skills && applicantDetails.skills.length > 0 && (
                                <div>
                                    <p className="text-gray-700 font-medium">Additional Skills:</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {applicantDetails.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <p className="text-gray-700">
                                <strong className="font-medium">LinkedIn:</strong>{' '}
                                {applicantDetails.linkedin ? (
                                    <a href={applicantDetails.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {applicantDetails.linkedin}
                                    </a>
                                ) : 'Not provided'}
                            </p>
                            <p className="text-gray-700">
                                <strong className="font-medium">Portfolio:</strong>{' '}
                                {applicantDetails.portfolio ? (
                                    <a href={applicantDetails.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {applicantDetails.portfolio}
                                    </a>
                                ) : 'Not provided'}
                            </p>
                            <p className="text-gray-700">
                                <strong className="font-medium">Resume:</strong>{' '}
                                {applicantDetails.resume ? (
                                    <button
                                        onClick={handleViewResume}
                                        className="text-blue-500 hover:underline focus:outline-none"
                                        disabled={downloading}
                                    >
                                        {downloading ? 'Downloading...' : 'Download Resume'}
                                    </button>
                                ) : 'Not uploaded'}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 text-gray-600">
                            <p>No applicant details found. Please update your skills and details to complete your profile.</p>
                        </div>
                    )}
                    <div className="mt-6">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowProfileUpdate(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
                            >
                                Update Basic Profile
                            </button>
                            <button
                                onClick={() => setShowApplicantDetailsForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
                            >
                                Update Skills & Details
                            </button>
                            <AddSkillForm token={token} onSkillAdded={handleSkillAdded} />
                        </div>
                    </div>
                </div>

                {/* Modals for Profile Updates */}
                {showProfileUpdate && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
                            <ProfileUpdateForm
                                onClose={() => setShowProfileUpdate(false)}
                                onUpdate={handleProfileUpdate}
                            />
                        </div>
                    </div>
                )}
                {showApplicantDetailsForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
                            <ApplicantDetailsForm
                                onClose={() => setShowApplicantDetailsForm(false)}
                                onUpdate={handleApplicantDetailsUpdate}
                                token={token}
                            />
                        </div>
                    </div>
                )}

                {/* Application Tracking */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Track Your Applications</h2>
                    <ApplicationList />
                </div>

                {/* Apply to Jobs */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Apply to Jobs</h2>
                    <button
                        onClick={handleApplyToJobs}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
                    >
                        Browse Jobs
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApplicantDashboard;