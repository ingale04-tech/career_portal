// frontend/src/components/ShortlistedCount.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ShortlistedCount = () => {
    const [countData, setCountData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShortlistedCount = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8080/api/applications/shortlisted-count', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCountData(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching shortlisted count:', err);
                setError('Failed to fetch shortlisted count. Please try again.');
                setLoading(false);
            }
        };
        fetchShortlistedCount();
    }, []);

    if (loading) return <div className="text-gray-700">Loading shortlisted count...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Shortlisted Applicants</h3>
            <p className="text-gray-700 text-sm">
                <strong className="font-semibold text-gray-900">Total Shortlisted:</strong> {countData?.count || 0}
            </p>
        </div>
    );
};

export default ShortlistedCount;