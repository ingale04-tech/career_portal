import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const HrDetails = () => {
    const [hrDetails, setHrDetails] = useState({
        fullName: 'N/A',
        email: 'N/A',
        role: 'HR',
        companyName: 'N/A',
        designation: 'N/A',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        designation: '',
    });
    const [formLoading, setFormLoading] = useState(false);

    const fetchHrDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            // Fetch user details from /api/auth/me
            const userResponse = await axios.get('http://localhost:8080/api/auth/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Fetch HR-specific details from /api/hr/details (fixed endpoint)
            const hrDetailsResponse = await axios.get('http://localhost:8080/api/hr/details', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setHrDetails({
                fullName: userResponse.data.fullName || 'N/A',
                email: userResponse.data.email || 'N/A',
                role: userResponse.data.role.replace('ROLE_', '') || 'HR', // Format role (e.g., "ROLE_HR" -> "HR")
                companyName: hrDetailsResponse.data.companyName || 'N/A',
                designation: hrDetailsResponse.data.designation || 'N/A',
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching HR details:', err);
            setError('Failed to fetch HR details.');
            setLoading(false);
            if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
    };

    useEffect(() => {
        fetchHrDetails();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditDetails = () => {
        setFormData({
            companyName: hrDetails.companyName === 'N/A' ? '' : hrDetails.companyName,
            designation: hrDetails.designation === 'N/A' ? '' : hrDetails.designation,
        });
        setShowForm(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const trimmedCompanyName = formData.companyName.trim();
        const trimmedDesignation = formData.designation.trim();

        // Basic required field validation
        if (!trimmedCompanyName) {
            toast.error('Company name is required.');
            setFormLoading(false);
            return;
        }
        if (!trimmedDesignation) {
            toast.error('Designation is required.');
            setFormLoading(false);
            return;
        }

        // Length validation
        if (trimmedCompanyName.length > 100) {
            toast.error('Company name must be less than 100 characters.');
            setFormLoading(false);
            return;
        }
        if (trimmedDesignation.length > 50) {
            toast.error('Designation must be less than 50 characters.');
            setFormLoading(false);
            return;
        }

        // Regex validation for allowed characters
        const nameRegex = /^[a-zA-Z0-9\s]+$/;
        if (!nameRegex.test(trimmedCompanyName)) {
            toast.error('Company name can only contain letters, numbers, and spaces.');
            setFormLoading(false);
            return;
        }
        if (!nameRegex.test(trimmedDesignation)) {
            toast.error('Designation can only contain letters, numbers, and spaces.');
            setFormLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8080/api/hr/details', {
                companyName: trimmedCompanyName,
                designation: trimmedDesignation,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            toast.success(response.data.message || 'HR details updated successfully!');
            setShowForm(false);
            fetchHrDetails();
        } catch (err) {
            console.error('Error updating HR details:', err);
            const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update HR details. Please try again.';
            if (errorMessage === 'Another update occurred. Please try again.') {
                toast.warn(errorMessage, {
                    onClose: () => fetchHrDetails(),
                });
            } else {
                toast.error(`Error: ${errorMessage}`);
            }
            if (err.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 bg-white rounded-lg shadow-md flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading HR details...
            </div>
        );
    }

    if (error) {
        return <div className="p-4 bg-white rounded-lg shadow-md text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">HR Details</h2>
            {showForm ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleFormChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                            placeholder="e.g., TechCorp"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleFormChange}
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 shadow-sm"
                            placeholder="e.g., HR Manager"
                            required
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm flex items-center"
                            disabled={formLoading}
                        >
                            {formLoading ? (
                                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            {formLoading ? 'Saving...' : 'Save Details'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors duration-200 font-medium shadow-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="space-y-2">
                    <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-900">Name:</strong> {hrDetails.fullName}
                    </p>
                    <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-900">Email:</strong> {hrDetails.email}
                    </p>
                    <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-900">Role:</strong> {hrDetails.role}
                    </p>
                    <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-900">Company:</strong> {hrDetails.companyName}
                    </p>
                    <p className="text-gray-700 text-sm">
                        <strong className="font-semibold text-gray-900">Designation:</strong> {hrDetails.designation}
                    </p>
                    <button
                        onClick={handleEditDetails}
                        className="text-blue-500 hover:underline focus:outline-none text-sm"
                    >
                        {hrDetails.companyName === 'N/A' && hrDetails.designation === 'N/A' ? 'Add Details' : 'Edit Details'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default HrDetails;