// frontend/src/components/EditJobForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const EditJobForm = ({ job, onJobUpdated, onClose }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        category: '',
        salary: '',
        requirements: '',
        status: 'OPEN',
    });
    const [image, setImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize form data with the job's current details
        if (job) {
            setFormData({
                title: job.title || '',
                description: job.description || '',
                location: job.location || '',
                category: job.category || '',
                salary: job.salary ? job.salary.toString() : '',
                requirements: job.requirements || '',
                status: job.status || 'OPEN',
            });
            setPreviewImage(job.imageUrl || 'https://via.placeholder.com/150?text=No+Image');
        }
    }, [job]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file (e.g., .jpg, .png).');
                return;
            }
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB.');
                return;
            }
            setImage(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const data = new FormData();
            // Send job details as a JSON string in the 'job' part
            data.append('job', JSON.stringify(formData));
            // Send the image file if selected
            if (image) {
                data.append('image', image);
            }

            const response = await axios.put(`http://localhost:8080/api/jobs/${job.id}`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Note: 'Content-Type' is automatically set to 'multipart/form-data' by axios when using FormData
                },
            });

            toast.success('Job updated successfully!');
            onJobUpdated(response.data); // Pass the updated job data to the parent component
            onClose(); // Close the modal
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Failed to update job. Please try again.';
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = '/login'; // Redirect to login
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-blue-800 text-center uppercase mb-4">
                    Edit Job
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Salary</label>
                        <input
                            type="number"
                            name="salary"
                            value={formData.salary}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Requirements</label>
                        <textarea
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="OPEN">Open</option>
                            <option value="CLOSE">Closed</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Job Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {previewImage && (
                            <div className="mt-2">
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className="w-32 h-32 object-cover rounded-md"
                                    onError={(e) => (e.target.src = 'https://via.placeholder.com/150?text=No+Image')}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? 'Updating...' : 'Update Job'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500 hover:bg-gray-600'
                            }`}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJobForm;