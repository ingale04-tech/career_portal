import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import JobCard from '../components/JobCard';
import ShortlistedCount from '../components/ShortlistedCount';
import HrDetails from '../components/HrDetails';

const HrDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        title: '',
        location: '',
        category: '',
        status: 'ALL', // Default to showing all jobs
    });
    const [titleOptions, setTitleOptions] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in.');
            }

            const response = await axios.get('http://localhost:8080/api/jobs/my-jobs', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const fetchedJobs = response.data;
            setJobs(fetchedJobs);
            setFilteredJobs(fetchedJobs);

            const titles = [...new Set(fetchedJobs.map(job => job.title?.toLowerCase()))]
                .sort()
                .map(title => fetchedJobs.find(job => job.title?.toLowerCase() === title).title);
            const locations = [...new Set(fetchedJobs.map(job => job.location?.toLowerCase()))]
                .sort()
                .map(location => fetchedJobs.find(job => job.location?.toLowerCase() === location).location);
            const categories = [...new Set(fetchedJobs.map(job => job.category?.toLowerCase()))]
                .sort()
                .map(category => fetchedJobs.find(job => job.category?.toLowerCase() === category).category);

            setTitleOptions(['', ...titles]);
            setLocationOptions(['', ...locations]);
            setCategoryOptions(['', ...categories]);

            setLoading(false);
        } catch (err) {
            setError('Failed to fetch jobs. Please try again.');
            setLoading(false);
            if (err.response?.status === 401 || err.message === 'No authentication token found. Please log in.') {
                toast.error('Session expired. Please log in again.');
                localStorage.removeItem('token');
                navigate('/login');
            }
        }
    };

    const handleJobUpdated = (updatedJob) => {
        const updatedJobs = jobs.map(job => (job.id === updatedJob.id ? updatedJob : job));
        setJobs(updatedJobs);

        // Reapply filters to the updated jobs list
        const filtered = updatedJobs.filter(job => {
            const matchesTitle = filters.title ? job.title === filters.title : true;
            const matchesLocation = filters.location ? job.location === filters.location : true;
            const matchesCategory = filters.category ? job.category === filters.category : true;
            const matchesStatus = filters.status && filters.status !== 'ALL' ? job.status === filters.status : true;
            return matchesTitle && matchesLocation && matchesCategory && matchesStatus;
        });
        setFilteredJobs(filtered);

        // Update filter options if necessary
        const titles = [...new Set(updatedJobs.map(job => job.title?.toLowerCase()))]
            .sort()
            .map(title => updatedJobs.find(job => job.title?.toLowerCase() === title).title);
        const locations = [...new Set(updatedJobs.map(job => job.location?.toLowerCase()))]
            .sort()
            .map(location => updatedJobs.find(job => job.location?.toLowerCase() === location).location);
        const categories = [...new Set(updatedJobs.map(job => job.category?.toLowerCase()))]
            .sort()
            .map(category => updatedJobs.find(job => job.category?.toLowerCase() === category).category);

        setTitleOptions(['', ...titles]);
        setLocationOptions(['', ...locations]);
        setCategoryOptions(['', ...categories]);
    };

    useEffect(() => {
        fetchJobs();
    }, [navigate, location]);

    useEffect(() => {
        const fetchFilteredJobs = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const params = {};
                if (filters.title) params.title = filters.title;
                if (filters.location) params.location = filters.location;
                if (filters.category) params.category = filters.category;
                if (filters.status && filters.status !== 'ALL') params.status = filters.status;

                const response = await axios.get('http://localhost:8080/api/jobs/my-jobs', {
                    headers: { Authorization: `Bearer ${token}` },
                    params,
                });
                setFilteredJobs(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch filtered jobs. Please try again.');
                setLoading(false);
                if (err.response?.status === 401) {
                    toast.error('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };

        if (!loading) {
            fetchFilteredJobs();
        }
    }, [filters, navigate]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ title: '', location: '', category: '', status: 'ALL' });
        setError(null);
    };

    const handleJobDeleted = (jobId) => {
        const updatedJobs = jobs.filter(job => job.id !== jobId);
        setJobs(updatedJobs);
        setFilteredJobs(updatedJobs);

        // Update filter options after deletion
        const titles = [...new Set(updatedJobs.map(job => job.title?.toLowerCase()))]
            .sort()
            .map(title => updatedJobs.find(job => job.title?.toLowerCase() === title).title);
        const locations = [...new Set(updatedJobs.map(job => job.location?.toLowerCase()))]
            .sort()
            .map(location => updatedJobs.find(job => job.location?.toLowerCase() === location).location);
        const categories = [...new Set(updatedJobs.map(job => job.category?.toLowerCase()))]
            .sort()
            .map(category => updatedJobs.find(job => job.category?.toLowerCase() === category).category);

        setTitleOptions(['', ...titles]);
        setLocationOptions(['', ...locations]);
        setCategoryOptions(['', ...categories]);
    };

    if (loading) return <div className="text-center mt-10 text-gray-700">Loading...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto p-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-2xl font-bold text-blue-800 text-center uppercase mb-6">
                        HR Dashboard
                    </h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <HrDetails />
                        <ShortlistedCount />
                    </div>
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter My Jobs</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <select
                                    name="title"
                                    value={filters.title}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-gray-700 appearance-none transition-colors"
                                    disabled={loading || jobs.length === 0}
                                >
                                    <option value="">All Titles</option>
                                    {titleOptions.map((title, index) => (
                                        <option key={index} value={title}>{title}</option>
                                    ))}
                                </select>
                                <svg
                                    aria-hidden="true"
                                    className="absolute left-2 top-3 h-4 w-4 text-teal-500"
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
                            <div className="relative flex-1">
                                <select
                                    name="location"
                                    value={filters.location}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-gray-700 appearance-none transition-colors"
                                    disabled={loading || jobs.length === 0}
                                >
                                    <option value="">All Locations</option>
                                    {locationOptions.map((location, index) => (
                                        <option key={index} value={location}>{location}</option>
                                    ))}
                                </select>
                                <svg
                                    aria-hidden="true"
                                    className="absolute left-2 top-3 h-4 w-4 text-teal-500"
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
                            <div className="relative flex-1">
                                <select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-gray-700 appearance-none transition-colors"
                                    disabled={loading || jobs.length === 0}
                                >
                                    <option value="">All Categories</option>
                                    {categoryOptions.map((category, index) => (
                                        <option key={index} value={category}>{category}</option>
                                    ))}
                                </select>
                                <svg
                                    aria-hidden="true"
                                    className="absolute left-2 top-3 h-4 w-4 text-teal-500"
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
                            <div className="relative flex-1">
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white text-gray-700 appearance-none transition-colors"
                                    disabled={loading || jobs.length === 0}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="OPEN">Active (Open)</option>
                                    <option value="CLOSE">Inactive (Closed)</option>
                                </select>
                                <svg
                                    aria-hidden="true"
                                    className="absolute left-2 top-3 h-4 w-4 text-teal-500"
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
                            <button
                                onClick={handleClearFilters}
                                className="px-3 py-1 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors duration-200 shadow-sm disabled:bg-teal-400"
                                disabled={loading || jobs.length === 0}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-start mb-6 space-x-4">
                        <Link
                            to="/hr/create-job"
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                            Create New Job
                        </Link>
                        <Link
                            to="/jobs"
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200"
                        >
                            Browse Jobs
                        </Link>
                    </div>
                    {filteredJobs.length === 0 ? (
                        <p className="text-gray-600 text-center">
                            {jobs.length === 0 ? 'No jobs posted yet. Create a new job to get started!' : 'No job postings match the selected filters.'}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    isHrDashboard={true}
                                    canApply={false}
                                    onJobUpdated={handleJobUpdated}
                                    onJobDeleted={handleJobDeleted}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HrDashboard;