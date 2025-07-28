// frontend/src/pages/Applicants.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Applicants = () => {
    const [applicantsData, setApplicantsData] = useState([]);
    const [filteredApplicants, setFilteredApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('ALL');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchApplicants = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found. Please log in.');
                }

                // Fetch all jobs posted by the HR
                const jobsResponse = await axios.get('http://localhost:8080/api/jobs/my-jobs', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const jobs = jobsResponse.data;

                // Fetch applications for each job
                const applicationsPromises = jobs.map(async (job) => {
                    const appsResponse = await axios.get(`http://localhost:8080/api/applications/job/${job.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    return appsResponse.data.map(app => ({
                        ...app,
                        jobTitle: job.title,
                    }));
                });

                const allApplications = (await Promise.all(applicationsPromises)).flat();
                setApplicantsData(allApplications);
                setFilteredApplicants(allApplications);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching applicants:', err);
                setError('Failed to fetch applicants. Please try again.');
                setLoading(false);
                if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                    toast.error('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };
        fetchApplicants();
    }, [navigate]);

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        const selectedStatus = e.target.value;
        setStatusFilter(selectedStatus);

        if (selectedStatus === 'ALL') {
            setFilteredApplicants(applicantsData);
        } else {
            setFilteredApplicants(applicantsData.filter(app => app.status === selectedStatus));
        }
    };

    // Handle status update for an application
    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            // Send status as a query parameter
            const response = await axios.put(
                `http://localhost:8080/api/applications/${applicationId}/status?status=${newStatus}`,
                null,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const updatedApplications = applicantsData.map(app =>
                app.id === applicationId ? { ...app, status: response.data.status } : app
            );
            setApplicantsData(updatedApplications);

            // Reapply the filter
            if (statusFilter === 'ALL') {
                setFilteredApplicants(updatedApplications);
            } else {
                setFilteredApplicants(updatedApplications.filter(app => app.status === statusFilter));
            }

            toast.success('Application status updated successfully!');
        } catch (err) {
            console.error('Error updating application status:', err);
            const errorMessage = err.response?.data?.error || 'Failed to update application status. Please try again.';
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    // Function to download the resume
    const downloadResume = async (resumeUrl) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            if (!resumeUrl) {
                throw new Error('Resume URL is not available');
            }

            // Fetch the resume using the provided resume URL with authentication
            const response = await axios.get(resumeUrl, {
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
                const urlParts = resumeUrl.split('/');
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
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    if (loading) return <div className="text-center mt-10 text-gray-700">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-blue-800 text-center uppercase mb-6">
                        Applicants
                    </h1>

                    {/* Filter by Status */}
                    <div className="mb-6">
                        <label className="block text-gray-700 font-bold mb-2">Filter by Status:</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700 appearance-none transition-colors"
                            >
                                <option value="ALL">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="SHORTLISTED">Shortlisted</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="HIRED">Hired</option>
                            </select>
                            <svg
                                aria-hidden="true"
                                className="absolute left-2 top-3 h-4 w-4 text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </div>
                    </div>

                    {filteredApplicants.length === 0 ? (
                        <p className="text-gray-600 text-center">No applications found.</p>
                    ) : (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {filteredApplicants.map((app) => {
                                console.log('Application Data:', app); // Debug the entire application object
                                return (
                                    <div
                                        key={app.id}
                                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm animate-fadeIn"
                                    >
                                        <p className="text-gray-700 text-sm">
                                            <strong className="font-semibold">Applicant Name:</strong> {app.applicantName}
                                        </p>
                                        <p className="text-gray-700 text-sm">
                                            <strong className="font-semibold">Job Title:</strong> {app.jobTitle}
                                        </p>
                                        <p className="text-gray-700 text-sm">
                                            <strong className="font-semibold">Resume:</strong>{' '}
                                            {app.resumeUrl ? (
                                                <button
                                                    onClick={() => downloadResume(app.resumeUrl)}
                                                    className="text-blue-500 hover:underline focus:outline-none"
                                                >
                                                    Download Resume
                                                </button>
                                            ) : (
                                                <span className="text-gray-500">No resume available</span>
                                            )}
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
                                        <div className="mt-2">
                                            <select
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                                className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-700"
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="SHORTLISTED">Shortlisted</option>
                                                <option value="REJECTED">Rejected</option>
                                                <option value="HIRED">Hired</option>
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Applicants;