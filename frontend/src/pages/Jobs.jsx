import React, { useState, useEffect } from 'react';
import axios from 'axios';
import JobCard from '../components/JobCard';

const Jobs = ({ isLoggedIn, role }) => {
    const [jobs, setJobs] = useState([]);
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/jobs/all');
            setJobs(response.data);
            setFilteredJobs(response.data);
        } catch (err) {
            setError('Failed to fetch jobs. Please try again later.');
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (title) params.append('title', title);
            if (location) params.append('location', location);
            if (category) params.append('category', category);

            const response = await axios.get(`http://localhost:8080/api/jobs/search?${params.toString()}`);
            setFilteredJobs(response.data);
        } catch (err) {
            setError('Failed to search jobs. Please try again.');
            console.error('Error searching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setTitle('');
        setLocation('');
        setCategory('');
        setFilteredJobs(jobs);
        setError('');
    };

    const canApply = isLoggedIn && role === 'ROLE_APPLICANT';

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-6">Job Listings</h1>

            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
                <input
                    type="text"
                    placeholder="Search by title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="p-2 border rounded-md w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Search by location..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="p-2 border rounded-md w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Search by category..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-2 border rounded-md w-full sm:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSearch}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-orange-500 transition"
                >
                    Search
                </button>
                <button
                    onClick={handleClear}
                    className="p-2 bg-gray-500 text-white rounded-md hover:bg-orange-500 transition"
                >
                    Clear
                </button>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {loading && <p className="text-center text-gray-500">Loading jobs...</p>}

            {!loading && filteredJobs.length === 0 && !error && (
                <p className="text-center text-gray-500">No jobs found.</p>
            )}
            {!loading && filteredJobs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <JobCard key={job.id} job={job} canApply={canApply} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Jobs;