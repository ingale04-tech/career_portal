// frontend/src/components/HiringReport.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const HiringReport = ({ jobId, onClose }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHiringReport = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:8080/api/applications/report/${jobId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setReport(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching hiring report:', err);
                setError('Failed to fetch hiring report. Please try again.');
                setLoading(false);
            }
        };
        fetchHiringReport();
    }, [jobId]);

    if (loading) return <div className="text-center mt-10">Loading report...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Hiring Report for Job ID: {jobId}</h2>
                {report ? (
                    <div className="space-y-2">
                        <p className="text-gray-700 text-sm">
                            <strong className="font-semibold text-gray-900">Total Applications:</strong> {report.totalApplications || 'N/A'}
                        </p>
                        <p className="text-gray-700 text-sm">
                            <strong className="font-semibold text-gray-900">Pending:</strong> {report.statusBreakdown?.Pending || 0}
                        </p>
                        <p className="text-gray-700 text-sm">
                            <strong className="font-semibold text-gray-900">Reviewed:</strong> {report.statusBreakdown?.Reviewed || 0}
                        </p>
                        <p className="text-gray-700 text-sm">
                            <strong className="font-semibold text-gray-900">Accepted:</strong> {report.statusBreakdown?.Accepted || 0}
                        </p>
                        <p className="text-gray-700 text-sm">
                            <strong className="font-semibold text-gray-900">Rejected:</strong> {report.statusBreakdown?.Rejected || 0}
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-600 text-center">No report data available.</p>
                )}
                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default HiringReport;