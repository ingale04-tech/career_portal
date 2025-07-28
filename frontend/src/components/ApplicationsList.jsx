import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ApplicationsList = ({ jobId, onClose }) => {
    const [applications, setApplications] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Define valid status values that match the backend ApplicationStatus enum
    const validStatuses = ['PENDING', 'SHORTLISTED', 'REJECTED', 'HIRED'];

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem('token');
                const url = filterStatus
                    ? `http://localhost:8080/api/applications/job/${jobId}/filter?status=${filterStatus}`
                    : `http://localhost:8080/api/applications/job/${jobId}`;
                const response = await axios.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setApplications(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching applications:', err);
                setError('Failed to fetch applications. Please try again.');
                setLoading(false);
            }
        };
        fetchApplications();
    }, [jobId, filterStatus]);

    const handleStatusChange = async (applicationId, newStatus) => {
        // Normalize the status to uppercase to match backend expectations
        const normalizedStatus = newStatus.toUpperCase();

        // Validate the status before sending the request
        if (!validStatuses.includes(normalizedStatus)) {
            toast.error(`Invalid status value: ${newStatus}`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `http://localhost:8080/api/applications/${applicationId}/status`,
                null,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { status: normalizedStatus },
                }
            );
            setApplications(applications.map(app =>
                app.id === applicationId ? { ...app, status: response.data.status } : app
            ));
            toast.success('Application status updated successfully!');
        } catch (err) {
            console.error('Error updating application status:', err);
            const errorMessage = err.response?.data?.error || 'Failed to update application status. Please try again.';
            toast.error(errorMessage);
        }
    };

    // Function to handle resume download with authentication
    const handleViewResume = async (resumeUrl) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication token not found. Please log in again.');
                return;
            }

            const response = await axios.get(resumeUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob', // Important: Tell axios to handle the response as a binary blob
            });

            // Create a URL for the blob and trigger a download
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = resumeUrl.substring(resumeUrl.lastIndexOf('/') + 1); // Extract the filename from the URL
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success('Resume downloaded successfully!');
        } catch (err) {
            console.error('Error downloading resume:', err);
            const errorMessage = err.response?.data?.error || 'Failed to download resume. Please try again.';
            toast.error(errorMessage);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading applications...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Applications for Job ID: {jobId}</h2>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-semibold mb-1">Filter by Status:</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="HIRED">Hired</option>
                    </select>
                </div>
                {applications.length === 0 ? (
                    <p className="text-gray-600 text-center">No applications found for this job.</p>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {applications.map((app) => (
                            <div key={app.id} className="border-b border-gray-200 pb-4">
                                <p className="text-gray-700 text-sm">
                                    <strong className="font-semibold text-gray-900">Applicant Name:</strong> {app.applicantName}
                                </p>
                                <p className="text-gray-700 text-sm">
                                    <strong className="font-semibold text-gray-900">Resume:</strong>{' '}
                                    <button
                                        onClick={() => handleViewResume(app.resumeUrl)}
                                        className="text-blue-600 hover:underline focus:outline-none"
                                    >
                                        View Resume
                                    </button>
                                </p>
                                <p className="text-gray-700 text-sm">
                                    <strong className="font-semibold text-gray-900">Status:</strong> {app.status}
                                </p>
                                <p className="text-gray-700 text-sm">
                                    <strong className="font-semibold text-gray-900">Applied On:</strong>{' '}
                                    {new Date(app.appliedAt).toLocaleDateString()}
                                </p>
                                <div className="mt-2 flex space-x-2">
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                        className="border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="SHORTLISTED">Shortlisted</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="HIRED">Hired</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default ApplicationsList;