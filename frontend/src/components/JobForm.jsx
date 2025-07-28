// frontend/src/components/JobForm.jsx (or CreateJobForm.jsx)
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const JobForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        salary: '',
        location: '',
        category: '',
        status: 'OPEN',
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('job', JSON.stringify(formData));
            if (imageFile) {
                formDataToSend.append('image', imageFile);
            }

            await axios.post('http://localhost:8080/api/jobs/create', formDataToSend, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Job created successfully!');
            setFormData({
                title: '',
                description: '',
                requirements: '',
                salary: '',
                location: '',
                category: '',
                status: 'OPEN',
            });
            setImageFile(null);
            navigate('/hr'); // Navigate back to HR Dashboard
        } catch (err) {
            console.error('Error creating job:', err);
            toast.error('Failed to create job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/hr'); // Navigate back to HR Dashboard
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create a Job</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {/* Description */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        />
                    </div>
                    {/* Requirements */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Requirements</label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        />
                    </div>
                    {/* Salary */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Salary</label>
                        <input
                            type="number"
                            name="salary"
                            value={formData.salary}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {/* Location */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {/* Category */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    {/* Status */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="OPEN">Open</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    {/* Job Image */}
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Job Image (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {/* Buttons */}
                    <div className="flex space-x-4">
                        <button
                            type="submit"
                            className="w-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Job'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-1/2 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobForm;