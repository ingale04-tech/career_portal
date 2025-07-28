// frontend/src/components/JobCard.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import EditJobForm from './EditJobForm';
import ApplicationsList from './ApplicationsList';
import HiringReport from './HiringReport';

const JobCard = ({ job, isHrDashboard = false, canApply, onJobUpdated, onJobDeleted }) => {
    // State for managing resume upload for job applications
    const [resumeFile, setResumeFile] = useState(null);
    const [showResumeInput, setShowResumeInput] = useState(false);
    const [isApplying, setIsApplying] = useState(false); // Track application submission state

    // State for managing modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showApplicationsModal, setShowApplicationsModal] = useState(false);
    const [showHiringReportModal, setShowHiringReportModal] = useState(false);

    // State for toggling job status
    const [togglingStatus, setTogglingStatus] = useState(false);

    const navigate = useNavigate();

    // Debug: Log the job and canApply props
    useEffect(() => {
        console.log('JobCard job prop:', job);
        console.log('JobCard canApply prop:', canApply);
        if (!job || !job.id) {
            console.error('JobCard received invalid job prop:', job);
        }
    }, [job, canApply]);

    // Handle job application submission
    const handleApply = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Please log in to apply.');
            navigate('/login');
            return;
        }

        if (!resumeFile) {
            toast.error('Please upload a resume file.');
            return;
        }

        if (resumeFile.type !== 'application/pdf') {
            toast.error('Please upload a PDF file.');
            return;
        }

        setIsApplying(true);
        try {
            const formData = new FormData();
            formData.append('resume', resumeFile);

            const response = await axios.post(
                `http://localhost:8080/api/applications/apply/${job.id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            toast.success(response.data.message || 'Application submitted successfully!');
            setResumeFile(null);
            setShowResumeInput(false);
            // Update the parent component to reflect that the user has applied
            if (onJobUpdated) {
                onJobUpdated({ ...job, canApply: false });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to apply. Please try again.';
            toast.error(errorMessage);
            if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setIsApplying(false);
        }
    }, [resumeFile, job, onJobUpdated, navigate]);

    // Handle job deletion
    const handleDelete = useCallback(async () => {
        if (!job.id) {
            toast.error('Cannot delete job: Invalid job ID.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this job posting?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            await axios.delete(`http://localhost:8080/api/jobs/${job.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Job deleted successfully!');
            onJobDeleted(job.id);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to delete job. Please try again.';
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    }, [job, onJobDeleted, navigate]);

    // Handle toggling job status
    const handleToggleStatus = useCallback(async () => {
        if (!job.id) {
            toast.error('Cannot toggle job status: Invalid job ID.');
            return;
        }

        const action = job.status === 'OPEN' ? 'close' : 'reopen';
        if (!window.confirm(`Are you sure you want to ${action} this job posting?`)) return;

        setTogglingStatus(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }
            const response = await axios.put(`http://localhost:8080/api/jobs/toggle-status/${job.id}`, null, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success(`Job ${response.data.status === 'OPEN' ? 'reopened' : 'closed'} successfully!`);
            onJobUpdated(response.data); // Update the parent state with the updated job
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to toggle job status. Please try again.';
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        } finally {
            setTogglingStatus(false);
        }
    }, [job, onJobUpdated, navigate]);

    // Handle job update from EditJobForm
    const handleJobUpdated = useCallback((updatedJob) => {
        onJobUpdated(updatedJob);
        setShowEditModal(false);
    }, [onJobUpdated]);

    // Toggle resume input visibility
    const toggleResumeInput = () => {
        setShowResumeInput(prev => !prev);
        setResumeFile(null); // Reset resume file when toggling
    };

    // Ensure only one modal is open at a time
    const openEditModal = () => {
        if (!job.id) {
            toast.error('Cannot edit job: Invalid job ID.');
            return;
        }
        setShowEditModal(true);
        setShowApplicationsModal(false);
        setShowHiringReportModal(false);
    };

    const openApplicationsModal = () => {
        if (!job.id) {
            toast.error('Cannot view applications: Invalid job ID.');
            return;
        }
        setShowApplicationsModal(true);
        setShowEditModal(false);
        setShowHiringReportModal(false);
    };

    const openHiringReportModal = () => {
        if (!job.id) {
            toast.error('Cannot view hiring report: Invalid job ID.');
            return;
        }
        setShowHiringReportModal(true);
        setShowEditModal(false);
        setShowApplicationsModal(false);
    };

    // If job is invalid, don't render the card
    if (!job || !job.id) {
        return <div className="text-red-500">Invalid job data.</div>;
    }

    return (
        <div className="rounded-lg shadow-md p-5 bg-white hover:shadow-lg transition-shadow duration-300">
            {/* Job Details (clickable to view full details) */}
            <Link to={`/jobs/${job.id}`} className="block">
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        {job.imageUrl ? (
                            <img
                                src={job.imageUrl}
                                alt={job.title}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                                onLoad={(e) => {
                                    e.target.style.display = 'block';
                                    e.target.nextSibling.style.display = 'none';
                                }}
                            />
                        ) : null}
                        <div
                            className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200"
                            style={{ display: job.imageUrl ? 'none' : 'flex' }}
                        >
                            <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase">{job.title}</h2>
                        <div className="space-y-1 mb-3">
                            <p className="text-gray-700 text-sm">
                                <strong className="font-semibold text-gray-900">Location:</strong> {job.location}
                            </p>
                            <p className="text-gray-700 text-sm">
                                <strong className="font-semibold text-gray-900">Category:</strong> {job.category}
                            </p>
                            <p className="text-gray-700 text-sm">
                                <strong className="font-semibold text-gray-900">Salary:</strong> ${job.salary.toLocaleString()}
                            </p>
                            <p className="text-gray-700 text-sm">
                                <strong className="font-semibold text-gray-900">Posted:</strong> {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-gray-700 text-sm">
                                <strong className="font-semibold text-gray-900">Status:</strong> {job.status}
                            </p>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{job.description}</p>
                    </div>
                </div>
            </Link>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col space-y-3">
                {isHrDashboard ? (
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={openEditModal}
                            className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors duration-200"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors duration-200"
                        >
                            Delete
                        </button>
                        <button
                            onClick={handleToggleStatus}
                            className={`flex-1 px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                                job.status === 'OPEN'
                                    ? 'bg-orange-500 hover:bg-orange-600'
                                    : 'bg-green-500 hover:bg-green-600'
                            }`}
                            disabled={togglingStatus}
                        >
                            {togglingStatus
                                ? (job.status === 'OPEN' ? 'Closing...' : 'Reopening...')
                                : (job.status === 'OPEN' ? 'Close' : 'Reopen')}
                        </button>
                        <button
                            onClick={openApplicationsModal}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200"
                        >
                            View Applications
                        </button>
                        <button
                            onClick={openHiringReportModal}
                            className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors duration-200"
                        >
                            View Hiring Report
                        </button>
                    </div>
                ) : (
                    <>
                        {showResumeInput ? (
                            <div className="flex flex-col space-y-2">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setResumeFile(e.target.files[0])}
                                    className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isApplying}
                                />
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleApply}
                                        disabled={isApplying}
                                        className={`flex-1 px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                                            isApplying ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {isApplying ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                    <button
                                        onClick={toggleResumeInput}
                                        disabled={isApplying}
                                        className={`text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200 ${
                                            isApplying ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            canApply ? (
                                <button
                                    onClick={toggleResumeInput}
                                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                                >
                                    Apply
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        toast.error('Please log in as a candidate to apply for jobs.');
                                        navigate('/login');
                                    }}
                                    className="w-full bg-gray-500 text-white px-4 py-2 rounded-md cursor-not-allowed"
                                    disabled
                                >
                                    Apply (Login Required)
                                </button>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditJobForm
                    job={job}
                    onJobUpdated={handleJobUpdated}
                    onClose={() => setShowEditModal(false)}
                />
            )}
            {showApplicationsModal && (
                <ApplicationsList
                    jobId={job.id}
                    onClose={() => setShowApplicationsModal(false)}
                />
            )}
            {showHiringReportModal && (
                <HiringReport
                    jobId={job.id}
                    onClose={() => setShowHiringReportModal(false)}
                />
            )}
        </div>
    );
};

export default JobCard;