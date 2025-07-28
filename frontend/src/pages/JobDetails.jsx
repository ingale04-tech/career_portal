import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import placeholderImage from '../assets/no-image-available.png'; // Ensure this file exists

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [showResumeInput, setShowResumeInput] = useState(false);

    useEffect(() => {
        if (!id || isNaN(id)) {
            setError('Invalid job ID.');
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Please log in to view job details.');
            toast.error('Please log in to view job details.');
            navigate('/login');
            setLoading(false);
            return;
        }

        const abortController = new AbortController();

        const fetchJob = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await axios.get(`http://localhost:8080/api/jobs/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: abortController.signal,
                });
                setJob(response.data);
            } catch (err) {
                if (axios.isCancel(err)) {
                    console.log('Request canceled:', err.message);
                    return;
                }

                if (err.response) {
                    const { status, data } = err.response;
                    if (status === 401) {
                        setError('Session expired. Please log in again.');
                        toast.error('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        navigate('/login');
                    } else if (status === 404) {
                        setError(data.message || 'Job not found.');
                        toast.error(data.message || 'Job not found.');
                    } else if (status === 403) {
                        setError('You are not authorized to view this job.');
                        toast.error('You are not authorized to view this job.');
                    } else {
                        setError('Failed to fetch job details. Please try again.');
                        toast.error('Failed to fetch job details. Please try again.');
                        console.error('Error fetching job:', err);
                    }
                } else if (err.request) {
                    setError('Network error. Please check your connection.');
                    toast.error('Network error. Please check your connection.');
                } else {
                    setError('An unexpected error occurred. Please try again.');
                    toast.error('An unexpected error occurred. Please try again.');
                    console.error('Error fetching job:', err);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchJob();

        return () => {
            abortController.abort();
        };
    }, [id, navigate]);

    const handleApply = async () => {
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

        const abortController = new AbortController();

        try {
            const formData = new FormData();
            formData.append('resume', resumeFile);

            const response = await axios.post(
                `http://localhost:8080/api/applications/apply/${id}`,
                formData,
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    signal: abortController.signal,
                    timeout: 5000,
                }
            );

            toast.success(response.data.message || 'Application submitted successfully!');
            setResumeFile(null);
            setShowResumeInput(false);
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('Apply request canceled:', err.message);
                return;
            }

            if (err.code === 'ECONNABORTED') {
                toast.error('Request timed out. Please try again.');
            } else if (err.response) {
                const { status, data } = err.response;
                if (status === 400) {
                    toast.error(data.message || 'Bad request. Please check your file.');
                } else if (status === 401) {
                    toast.error('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                } else if (status === 403) {
                    toast.error('You are not authorized to apply.');
                } else if (status === 404) {
                    toast.error(data.message || 'Job not found.');
                } else if (status === 409) {
                    toast.error(data.message || 'You already applied.');
                } else if (status === 500) {
                    toast.error('Server error. Please try again later.');
                } else {
                    toast.error('Failed to apply. Please try again.');
                }
            } else {
                toast.error('Network error. Please check your connection.');
            }
            console.error('Error applying for job:', err);
        }
    };

    if (loading) return <p className="text-center text-gray-500">Loading...</p>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;
    if (!job) return <p className="text-center text-gray-500">Job not found.</p>;

    return (
        <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl w-full text-center">
                <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
                {job.imageUrl && (
                    <img
                        src={job.imageUrl}
                        alt={job.title}
                        className="w-full max-w-md h-64 object-cover rounded-md mb-4 mx-auto"
                        onError={(e) => {
                            e.target.src = placeholderImage;
                            e.target.onerror = null; // Prevent infinite loop
                        }}
                    />
                )}
                <div className="text-left max-w-md mx-auto">
                    <p className="text-gray-600 mb-2">
                        <strong className="inline-block w-24">Location:</strong> {job.location}
                    </p>
                    <p className="text-gray-600 mb-2">
                        <strong className="inline-block w-24">Category:</strong> {job.category}
                    </p>
                    <p className="text-gray-600 mb-2">
                        <strong className="inline-block w-24">Salary:</strong> ${job.salary.toLocaleString()}
                    </p>
                    <p className="text-gray-600 mb-2">
                        <strong className="inline-block w-24">Posted:</strong> {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 mb-4">
                        <strong className="inline-block w-24">Status:</strong> {job.status}
                    </p>
                </div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-600 mb-4">{job.description}</p>
                <h2 className="text-xl font-semibold mb-2">Requirements</h2>
                <p className="text-gray-600 mb-4">{job.requirements}</p>
                {job.status === 'OPEN' && (
                    <div className="flex flex-col space-y-3 items-center">
                        {showResumeInput ? (
                            <div className="flex flex-col space-y-2 w-full max-w-md">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setResumeFile(e.target.files[0])}
                                    className="border rounded-md p-2 w-full"
                                />
                                <div className="flex space-x-3 justify-center">
                                    <button
                                        onClick={handleApply}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-48"
                                    >
                                        Submit Application
                                    </button>
                                    <button
                                        onClick={() => setShowResumeInput(false)}
                                        className="text-gray-500 hover:underline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowResumeInput(true)}
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 w-48"
                            >
                                Apply for this Job
                            </button>
                        )}
                    </div>
                )}
                <Link to="/jobs" className="block mt-4 text-blue-500 hover:underline">Back to Jobs</Link>
            </div>
        </div>
    );
};

export default JobDetails;