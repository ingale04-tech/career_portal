// frontend/src/components/ApplicantDetailsForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ApplicantDetailsForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        skill: '',
        experience: '',
        linkedin: '',
        portfolio: '',
    });
    const [resumeFile, setResumeFile] = useState(null);
    const [currentResumeUrl, setCurrentResumeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [profileExists, setProfileExists] = useState(true);

    const fetchApplicantDetails = async () => {
        setDataLoading(true);
        setFetchError(false);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(
                'http://localhost:8080/api/applications/applicant-details',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.profileExists === false) {
                setProfileExists(false);
                setFormData({
                    skill: '',
                    experience: '',
                    linkedin: '',
                    portfolio: '',
                });
                setCurrentResumeUrl('');
            } else {
                setProfileExists(true);
                setFormData({
                    skill: response.data.primarySkill || '',
                    experience: response.data.experience || '',
                    linkedin: response.data.linkedin || '',
                    portfolio: response.data.portfolio || '',
                });
                setCurrentResumeUrl(response.data.resume || '');
            }
            setDataLoaded(true);
        } catch (err) {
            console.error('Error fetching applicant details:', err);
            toast.error('Failed to load applicant details. Please try again.');
            setFetchError(true);
            setDataLoaded(false);
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        fetchApplicantDetails();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                toast.error('Resume file size exceeds 5MB limit.');
                setResumeFile(null);
                return;
            }
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Resume must be a PDF or Word document.');
                setResumeFile(null);
                return;
            }
            setResumeFile(file);
        }
    };

    const isValidUrl = (url, type) => {
        if (!url) return true;
        try {
            const parsedUrl = new URL(url);
            if (type === 'linkedin') {
                return (
                    (parsedUrl.hostname === 'linkedin.com' || parsedUrl.hostname === 'www.linkedin.com') &&
                    url.startsWith('https://')
                );
            }
            return url.startsWith('http://') || url.startsWith('https://');
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.skill.trim()) {
            toast.error('Primary skill is required.');
            setLoading(false);
            return;
        }

        const experienceValue = formData.experience ? Number(formData.experience) : null;
        if (experienceValue !== null && (isNaN(experienceValue) || experienceValue < 0)) {
            toast.error('Experience must be a non-negative number.');
            setLoading(false);
            return;
        }
        const roundedExperience = experienceValue !== null ? Math.round(experienceValue) : null;
        if (experienceValue !== null && roundedExperience !== experienceValue) {
            toast.warn('Experience has been rounded to the nearest whole number, as only whole numbers are supported.');
        }

        if (formData.linkedin && !isValidUrl(formData.linkedin, 'linkedin')) {
            toast.error('Please enter a valid LinkedIn URL (must start with https://linkedin.com/) or leave it empty.');
            setLoading(false);
            return;
        }

        if (formData.portfolio && !isValidUrl(formData.portfolio)) {
            toast.error('Please enter a valid Portfolio URL (must start with http:// or https://).');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formDataToSend = new FormData();
            formDataToSend.append('skill', formData.skill);
            formDataToSend.append('experience', roundedExperience !== null ? roundedExperience : '');
            formDataToSend.append('linkedin', formData.linkedin || '');
            formDataToSend.append('portfolio', formData.portfolio || '');
            if (resumeFile) {
                formDataToSend.append('resume', resumeFile);
            }

            const endpoint = profileExists
                ? 'http://localhost:8080/api/applications/primary-skill'
                : 'http://localhost:8080/api/applications/applicant-details';

            const method = profileExists ? axios.put : axios.post;

            const response = await method(
                endpoint,
                formDataToSend,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            toast.success(response.data.message || 'Profile details updated successfully!');
            setProfileExists(true);
            setCurrentResumeUrl(response.data.resume || currentResumeUrl);
            await fetchApplicantDetails();
            onClose();
        } catch (err) {
            console.error('Error updating applicant details:', err);
            const errorMessage = err.response?.data?.error || 'Failed to update details. Please try again.';
            if (errorMessage === 'Another update occurred. Please try again.') {
                toast.warn(errorMessage, {
                    onClose: () => {
                        fetchApplicantDetails();
                    },
                });
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadResume = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Make an authenticated request to download the resume
            const response = await axios.get(currentResumeUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob', // Important: Treat the response as a binary blob
            });

            // Extract the filename from the URL or set a default
            const urlParts = currentResumeUrl.split('/');
            const fileName = urlParts[urlParts.length - 1] || 'resume.pdf';

            // Create a temporary URL for the blob and trigger a download
            const blob = new Blob([response.data]);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading resume:', err);
            toast.error('Failed to download resume. Please try again.');
        }
    };

    if (dataLoading) {
        return (
            <div className="text-center p-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading your details...</p>
            </div>
        );
    }

    if (fetchError && !dataLoaded) {
        return (
            <div className="text-center p-6">
                <p className="text-red-600 mb-4">
                    Failed to load your details. Please try again.
                </p>
                <button
                    onClick={fetchApplicantDetails}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Update Skills & Details</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Primary Skill <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="skill"
                            value={formData.skill}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                            placeholder="e.g., Python"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Experience (Years) <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                            type="number"
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            min="0"
                            step="1"
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                            placeholder="e.g., 3"
                        />
                        <p className="text-gray-500 text-xs mt-2">
                            Note: Only whole numbers are supported (e.g., 0, 1, 2).
                        </p>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            LinkedIn <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                            placeholder="e.g., https://linkedin.com/in/yourprofile"
                        />
                        <p className="text-gray-500 text-xs mt-2">
                            Must start with https://linkedin.com/ or leave empty.
                        </p>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Portfolio <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            name="portfolio"
                            value={formData.portfolio}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                            placeholder="e.g., https://yourportfolio.com"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Resume <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        {currentResumeUrl && !resumeFile && (
                            <div className="mb-3">
                                <p className="text-gray-600 text-sm">Current Resume:</p>
                                <button
                                    onClick={downloadResume}
                                    className="text-blue-600 hover:underline text-sm focus:outline-none"
                                >
                                    Download Current Resume
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleResumeChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                        />
                        <p className="text-gray-500 text-xs mt-2">
                            Accepted formats: PDF, Word (.doc, .docx). Max size: 5MB.
                        </p>
                    </div>
                    <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg
                                            className="animate-spin h-5 w-5 mr-2 text-white inline-block"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Updating...
                                    </>
                                ) : (
                                    'Update Details'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicantDetailsForm;