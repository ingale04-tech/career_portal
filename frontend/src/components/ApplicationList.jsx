// frontend/src/components/ApplicationList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const ApplicationList = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userResumeUrl, setUserResumeUrl] = useState(''); // Store the user's resume URL
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found. Please log in.');
                }

                // Fetch applications
                const applicationsResponse = await axios.get('http://localhost:8080/api/applications/my-applications', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApplications(applicationsResponse.data);

                // Fetch applicant's resume URL from applicant-details
                const applicantDetailsResponse = await axios.get(
                    'http://localhost:8080/api/applications/applicant-details',
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setUserResumeUrl(applicantDetailsResponse.data.resume || '');

                setLoading(false);
            } catch (err) {
                console.error('Error fetching applications or applicant details:', err);
                toast.error('Failed to load applications. Please try again.');
                if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                    if (location.pathname !== '/login') {
                        toast.error('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        navigate('/login');
                    }
                }
            }
        };
        fetchApplications();
    }, [navigate, location]);

    const downloadResume = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            if (!userResumeUrl) {
                throw new Error('Resume URL is not available');
            }

            // Fetch the resume using the user's resume URL
            const response = await axios.get(userResumeUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            });

            // Extract filename from URL or response headers, or use a default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'resume.pdf';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1];
                }
            } else {
                const urlParts = userResumeUrl.split('/');
                fileName = urlParts[urlParts.length - 1] || 'resume.pdf';
            }

            // Create a blob and trigger download
            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);

            toast.success('Resume downloaded successfully!');
        } catch (err) {
            console.error('Error downloading resume:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to download resume. Please try again.';
            toast.error(errorMessage);
            if (err.response?.status === 401) {
                if (location.pathname !== '/login') {
                    toast.error('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        }
    };

    if (loading) return <div className="text-gray-600 text-center">Loading applications...</div>;

    return (
        <div>
            <main 
                className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-8"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1569470451072-68314f596aec?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">My Applications</h2>
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                        {applications.length === 0 ? (
                            <p className="text-gray-600 text-center">No applications found.</p>
                        ) : (
                            applications.map((app) => (
                                <div key={app.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                                    <p className="text-gray-700 text-sm">
                                        <strong className="font-semibold">Job Title:</strong> {app.jobTitle}
                                    </p>
                                    <p className="text-gray-700 text-sm">
                                        <strong className="font-semibold">Status:</strong> {app.status}
                                    </p>
                                    <p className="text-gray-700 text-sm">
                                        <strong className="font-semibold">Applied On:</strong>{' '}
                                        {app.appliedAt && !isNaN(new Date(app.appliedAt).getTime())
                                            ? new Date(app.appliedAt).toLocaleDateString()
                                            : 'Date not available'}
                                    </p>
                                    <p className="text-gray-700 text-sm">
                                        <strong className="font-semibold">Resume:</strong>{' '}
                                        {userResumeUrl ? (
                                            <button
                                                onClick={() => downloadResume()}
                                                className="text-blue-500 hover:underline focus:outline-none"
                                            >
                                                Download Resume
                                            </button>
                                        ) : (
                                            <span className="text-gray-500">No resume available</span>
                                        )}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ApplicationList;