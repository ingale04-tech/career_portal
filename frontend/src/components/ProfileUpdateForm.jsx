import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProfileUpdateForm = ({ onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8080/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const { fullName, email, phone } = response.data;
                setFormData({ fullName, email, phone: phone || '', password: '' });
            } catch (err) {
                console.error('Error fetching user data:', err);
                toast.error('Failed to load user data. Please try again.');
            }
        };
        fetchUserData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const newErrors = {};
        // Validate phone number format (e.g., 555-789-1234)
        if (formData.phone && !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number must be in the format 555-789-1234';
        }
        // Validate password (if provided)
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // Prepare query parameters for password and phone
            const params = new URLSearchParams();
            if (formData.password) {
                params.append('password', formData.password);
            }
            if (formData.phone) {
                // Remove hyphens from phone number for the backend
                const cleanedPhone = formData.phone.replace(/-/g, '');
                params.append('phone', cleanedPhone);
            }

            // Send the PUT request to the correct endpoint with query parameters
            await axios.put(
                `http://localhost:8080/api/auth/update-profile?${params.toString()}`,
                null, // No body since we're using query parameters
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            // Fetch updated user data to pass to the parent component
            const response = await axios.get('http://localhost:8080/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            onUpdate(response.data); // Pass updated data to parent component

            toast.success('Profile updated successfully!');
            onClose();
        } catch (err) {
            console.error('Error updating profile:', err);
            const errorMessage = err.response?.data?.error || 'Failed to update profile. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Basic Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">Phone Number (Optional)</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="555-789-1234"
                    />
                    {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">New Password (Optional)</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileUpdateForm;