// frontend/src/components/JobForm.jsx (or CreateJobForm.jsx)
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const JobForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        category: '',
        salary: '',
        description: '',
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
            setFormData({ title: '', location: '', category: '', salary: '', description: '' });
            setImageFile(null);
            navigate('/hr'); // Navigate back to HR Dashboard
        } catch (err) {
            console.error('Error creating job:', err);
            toast.error('Failed to create job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Job Posting</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-1">Image (Optional)</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Job'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JobForm;