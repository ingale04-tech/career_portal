import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [hrUsers, setHrUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [userCategories, setUserCategories] = useState([]);
    const [logs, setLogs] = useState('');
    const [errors, setErrors] = useState({});
    const [statusFilter, setStatusFilter] = useState('');
    const [decoded, setDecoded] = useState(null);
    const [resumeLinks, setResumeLinks] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingApplications, setLoadingApplications] = useState(false);

    useEffect(() => {
        setErrors({});
        setHrUsers([]);
        setAllUsers([]);
        setJobs([]);
        setApplications([]);
        setUserCategories([]);
        setLogs('');
        setResumeLinks({});

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            if (decodedToken.roles[0] !== 'ROLE_SUPER_ADMIN' || !decodedToken.approved) {
                navigate('/login');
                return;
            }
            setDecoded(decodedToken);
        } catch (error) {
            console.error('Invalid token:', error);
            navigate('/login');
            return;
        }

        const abortController = new AbortController();
        const fetchInitialData = async () => {
            setLoading(true);
            const startTime = Date.now();

            try {
                const endpoints = {
                    hrUsers: api.get('/admin/users/hr', { signal: abortController.signal }).then(res => res.data || []),
                    allUsers: api.get('/admin/users', { signal: abortController.signal }).then(res => res.data || []),
                    jobs: api.get('/admin/jobs', { signal: abortController.signal }).then(res => res.data || []),
                    userCategories: api.get('/admin/user-categories', { signal: abortController.signal }).then(res => res.data || []),
                    logs: api.get('/admin/logs', { signal: abortController.signal }).then(res => res.data || ''),
                };

                const results = await Promise.allSettled(Object.values(endpoints));
                const data = Object.keys(endpoints).reduce((acc, key, idx) => {
                    const result = results[idx];
                    if (result.status === 'fulfilled') {
                        acc[key] = result.value;
                    } else if (result.reason.name !== 'AbortError') {
                        if (!result.reason.message.toLowerCase().includes('cancelled')) {
                            acc.errors[key] = `Hang tight! We're fetching ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}...`;
                        }
                    }
                    return acc;
                }, { errors: {} });

                const elapsedTime = Date.now() - startTime;
                const minimumLoadingTime = 1000;
                if (elapsedTime < minimumLoadingTime) {
                    await new Promise(resolve => setTimeout(resolve, minimumLoadingTime - elapsedTime));
                }

                setHrUsers(data.hrUsers || []);
                setAllUsers(data.allUsers || []);
                setJobs(data.jobs || []);
                setUserCategories(data.userCategories || []);
                setLogs(data.logs || '');
                setErrors(data.errors);
            } catch (err) {
                if (err.name !== 'AbortError' && !err.message.toLowerCase().includes('cancelled')) {
                    setErrors(prev => ({ ...prev, general: "Hold on! We're gathering everything for you..." }));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        return () => abortController.abort();
    }, [navigate]);

    useEffect(() => {
        const abortController = new AbortController();
        const fetchApplications = async () => {
            setLoadingApplications(true);
            setErrors(prev => ({ ...prev, applications: null }));
            try {
                const response = await api.get('/admin/applications', {
                    params: { status: statusFilter || undefined },
                    signal: abortController.signal,
                });
                setApplications(response.data || []);
            } catch (err) {
                if (err.name !== 'AbortError' && !err.message.toLowerCase().includes('cancelled')) {
                    console.error('Applications fetch error:', err);
                    setErrors(prev => ({ ...prev, applications: "Fetching applications, just a moment..." }));
                }
            } finally {
                setLoadingApplications(false);
            }
        };

        fetchApplications();

        return () => abortController.abort();
    }, [statusFilter]);

    useEffect(() => {
        const checkResumeLinks = async () => {
            const linkStatus = {};
            for (const app of applications) {
                if (app.resumeUrl) {
                    try {
                        await api.head(app.resumeUrl);
                        linkStatus[app.id] = true;
                    } catch (err) {
                        linkStatus[app.id] = false;
                    }
                }
            }
            setResumeLinks(linkStatus);
        };

        if (applications.length > 0) {
            checkResumeLinks();
        }
    }, [applications]);

    const handleDownloadResume = async (applicationId, resumeUrl) => {
        try {
            const response = await api.get(resumeUrl, { responseType: 'blob' });
            const contentType = response.headers['content-type'];
            const blob = new Blob([response.data], { type: contentType });
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `resume-${applications.find(app => app.id === applicationId)?.applicant?.fullName || 'applicant'}.${contentType.includes('pdf') ? 'pdf' : 'doc'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            let errorMessage = 'An unexpected error occurred';
            if (err.response) {
                if (err.response.status === 404) errorMessage = 'Resume file not found';
                else if (err.response.status === 403) errorMessage = 'You do not have permission to view this resume';
                else if (err.response.data && err.response.data.error) errorMessage = err.response.data.error;
            } else if (err.message.includes('Network Error')) {
                errorMessage = 'Failed to fetch resume due to a network error. This might be a CORS issue.';
            } else {
                errorMessage = err.message;
            }
            setErrors(prev => ({ ...prev, [`resume_${applicationId}`]: `Oops! ${errorMessage}` }));
        }
    };

    const handleApproveHr = async (userId) => {
        try {
            await api.put(`/admin/approve-hr-super/${userId}`);
            setHrUsers(prev => prev.map(user => user.id === userId ? { ...user, isApproved: true } : user));
            setAllUsers(prev => prev.map(user => user.id === userId ? { ...user, isApproved: true } : user));
        } catch (err) {
            setErrors(prev => ({ ...prev, approveHr: "Something went wrong approving HR, try again!" }));
        }
    };

    const handleDisableUser = async (userId) => {
        try {
            await api.put(`/admin/disable-user/${userId}`);
            setHrUsers(prev => prev.map(user => user.id === userId ? { ...user, isApproved: false } : user));
            setAllUsers(prev => prev.map(user => user.id === userId ? { ...user, isApproved: false } : user));
        } catch (err) {
            setErrors(prev => ({ ...prev, disableUser: "Oops! Couldn't disable the user, try again!" }));
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this applicant? This will also delete all associated applications.");
        if (!confirmDelete) return;

        try {
            await api.delete(`/admin/users/${userId}`);
            setHrUsers(prev => prev.filter(user => user.id !== userId));
            setAllUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err) {
            let errorMessage = "Failed to delete user: An unexpected error occurred";
            if (err.response) {
                if (err.response.status === 409) errorMessage = err.response.data.error || "User cannot be deleted due to associated records.";
                else if (err.response.status === 400) errorMessage = err.response.data.error || "Invalid request.";
                else if (err.response.data && err.response.data.error) errorMessage = `Failed to delete user: ${err.response.data.error}`;
            } else if (!err.message.toLowerCase().includes('cancelled')) {
                errorMessage = `Failed to delete user: ${err.message}`;
            }
            if (!err.message || !err.message.toLowerCase().includes('cancelled')) {
                setErrors(prev => ({ ...prev, deleteUser: `Oops! ${errorMessage}` }));
            }
        }
    };

    const handleCloseJob = async (jobId) => {
        try {
            await api.put(`/admin/close-job/${jobId}`);
            setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'CLOSE' } : job));
        } catch (err) {
            setErrors(prev => ({ ...prev, closeJob: "Something went wrong closing the job, try again!" }));
        }
    };

    const handleReopenJob = async (jobId) => {
        try {
            await api.put(`/admin/reopen-job/${jobId}`);
            setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'OPEN' } : job));
        } catch (err) {
            setErrors(prev => ({ ...prev, reopenJob: "Oops! Couldn't reopen the job, try again!" }));
        }
    };

    const handleDeleteJob = async (jobId) => {
        try {
            await api.delete(`/admin/jobs/${jobId}`);
            setJobs(prev => prev.filter(job => job.id !== jobId));
        } catch (err) {
            setErrors(prev => ({ ...prev, deleteJob: "Something went wrong deleting the job, try again!" }));
        }
    };

    const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await api.put(`/admin/applications/${applicationId}/status`, { status: newStatus });
            setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
        } catch (err) {
            setErrors(prev => ({ ...prev, updateApplication: "Oops! Couldn't update the application, try again!" }));
        }
    };

    const handleDeleteApplication = async (applicationId) => {
        try {
            await api.delete(`/admin/applications/${applicationId}`);
            setApplications(prev => prev.filter(app => app.id !== applicationId));
        } catch (err) {
            setErrors(prev => ({ ...prev, deleteApplication: "Something went wrong deleting the application, try again!" }));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-4">Super Admin Dashboard</h1>
                <div className="flex flex-col items-center space-y-2">
                    <p className="text-lg text-gray-700 animate-pulse">
                        "Hang tight! We're pulling everything together for you..."
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 md:p-6 lg:p-8">
            <header className="w-full max-w-7xl mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-blue-700 text-center bg-gradient-to-r from-blue-500 to-blue-700 text-transparent bg-clip-text">
                    Super Admin Dashboard
                </h1>
                {Object.keys(errors).length > 0 && (
                    <div className="mt-4 space-y-2 w-full max-w-md mx-auto">
                        {Object.entries(errors).map(([key, msg]) => (
                            <p key={key} className="text-blue-600 bg-blue-100 p-3 rounded-lg text-center">
                                {msg}
                            </p>
                        ))}
                    </div>
                )}
            </header>

            <main className="w-full max-w-7xl space-y-8">
                <section className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">HR Users</h2>
                    {hrUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {hrUsers.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{user.fullName}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3">{user.isApproved ? 'Approved' : 'Pending'}</td>
                                            <td className="p-3 flex gap-2">
                                                {!user.isApproved && (
                                                    <button onClick={() => handleApproveHr(user.id)} className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700">
                                                        Approve
                                                    </button>
                                                )}
                                                <button onClick={() => handleDisableUser(user.id)} className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700">
                                                    {user.isApproved ? 'Disable' : 'Enable'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center">No HR users found{errors.hrUsers ? `: ${errors.hrUsers}` : ', data may not be loaded.'}</p>
                    )}
                </section>

                <section className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">All Users</h2>
                    {allUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map((user) => {
                                        const normalizedRole = user.role ? user.role.replace('ROLE_', '').toUpperCase() : '';
                                        console.log(`User ID: ${user.id}, Role: ${user.role}, Normalized Role: ${normalizedRole}`);
                                        return (
                                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                                <td className="p-3">{user.fullName}</td>
                                                <td className="p-3">{user.email}</td>
                                                <td className="p-3">{user.role}</td>
                                                <td className="p-3">{user.isApproved ? 'Approved' : 'Disabled'}</td>
                                                <td className="p-3 flex gap-2">
                                                    {normalizedRole === 'APPLICANT' ? (
                                                        <button onClick={() => handleDeleteUser(user.id)} className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700">
                                                            Delete
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-600">Deletion not allowed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center">No users found{errors.allUsers ? `: ${errors.allUsers}` : ', data may not be loaded.'}</p>
                    )}
                </section>

                <section className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">All Jobs</h2>
                    {jobs.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-3">Title</th>
                                        <th className="p-3">Category</th>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job) => (
                                        <tr key={job.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3">{job.title}</td>
                                            <td className="p-3">{job.category || 'No category'}</td>
                                            <td className="p-3">{job.status}</td>
                                            <td className="p-3 flex gap-2">
                                                {job.status === 'OPEN' && (
                                                    <button onClick={() => handleCloseJob(job.id)} className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700">
                                                        Close
                                                    </button>
                                                )}
                                                {job.status === 'CLOSE' && (
                                                    <button onClick={() => handleReopenJob(job.id)} className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700">
                                                        Open
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteJob(job.id)} className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center">No jobs found{errors.jobs ? `: ${errors.jobs}` : ', data may not be loaded.'}</p>
                    )}
                </section>

                <section className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">All Applications</h2>
                    <div className="mb-4">
                        <label htmlFor="statusFilter" className="mr-2">Filter by Status:</label>
                        <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-md">
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="HIRED">Hired</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="SHORTLISTED">Shortlisted</option>
                        </select>
                    </div>
                    {loadingApplications ? (
                        <div className="flex justify-center items-center">
                            <p className="text-gray-700 animate-pulse">
                                "Rounding up applications, just a sec!"
                            </p>
                        </div>
                    ) : applications.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-3 text-sm md:text-base">Applicant</th>
                                        <th className="p-3 text-sm md:text-base">Job Title</th>
                                        <th className="p-3 text-sm md:text-base md:hidden">Details</th>
                                        <th className="p-3 text-sm md:text-base hidden md:table-cell">Status</th>
                                        <th className="p-3 text-sm md:text-base hidden md:table-cell">Resume</th>
                                        <th className="p-3 text-sm md:text-base hidden md:table-cell">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map((app) => (
                                        <tr key={app.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 text-sm md:text-base break-words">
                                                {app.applicant?.fullName || 'Unknown'} (ID: {app.applicant?.id || 'N/A'})
                                            </td>
                                            <td className="p-3 text-sm md:text-base break-words">
                                                {app.job?.title || 'Unknown'} (ID: {app.job?.id || 'N/A'})
                                            </td>
                                            {/* Mobile View: Stack Status, Resume, and Action */}
                                            <td className="p-3 md:hidden">
                                                <div className="flex flex-col space-y-2">
                                                    <div>
                                                        <label className="text-sm font-medium">Status:</label>
                                                        <select
                                                            value={app.status}
                                                            onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                                                            className="p-1 border rounded-md text-sm w-full mt-1"
                                                        >
                                                            <option value="PENDING">Pending</option>
                                                            <option value="HIRED">Hired</option>
                                                            <option value="REJECTED">Rejected</option>
                                                            <option value="SHORTLISTED">Shortlisted</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium">Resume:</label>
                                                        {app.resumeUrl && resumeLinks[app.id] !== false ? (
                                                            <a
                                                                href={app.resumeUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 text-sm mt-1"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleDownloadResume(app.id, app.resumeUrl);
                                                                }}
                                                            >
                                                                Download Resume
                                                            </a>
                                                        ) : (
                                                            <span className="block text-gray-600 text-sm mt-1">No resume</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium">Action:</label>
                                                        <button
                                                            onClick={() => handleDeleteApplication(app.id)}
                                                            className="block bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 text-sm mt-1"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Desktop View: Keep as Table Columns */}
                                            <td className="p-3 hidden md:table-cell">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                                                    className="p-1 border rounded-md text-sm md:text-base w-full"
                                                >
                                                    <option value="PENDING">Pending</option>
                                                    <option value="HIRED">Hired</option>
                                                    <option value="REJECTED">Rejected</option>
                                                    <option value="SHORTLISTED">Shortlisted</option>
                                                </select>
                                            </td>
                                            <td className="p-3 hidden md:table-cell">
                                                {app.resumeUrl && resumeLinks[app.id] !== false ? (
                                                    <a
                                                        href={app.resumeUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm md:text-base"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleDownloadResume(app.id, app.resumeUrl);
                                                        }}
                                                    >
                                                        Download Resume
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-600 text-sm md:text-base">No resume</span>
                                                )}
                                            </td>
                                            <td className="p-3 hidden md:table-cell">
                                                <button
                                                    onClick={() => handleDeleteApplication(app.id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm md:text-base"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center">
                            {errors.applications ? errors.applications : "No applications found, data may not be loaded."}
                        </p>
                    )}
                </section>

                <section className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">User Categories</h2>
                    {userCategories.length > 0 ? (
                        <ul className="list-disc pl-5">
                            {userCategories.map((category, index) => (
                                <li key={index} className="text-gray-700">{category}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 text-center">No user categories found{errors.userCategories ? `: ${errors.userCategories}` : ', data may not be loaded.'}</p>
                    )}
                </section>

                <section className="bg-white shadow-lg rounded-lg p-6">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4">System Logs</h2>
                    {logs ? (
                        <pre className="bg-gray-100 p-4 rounded-md max-h-96 overflow-y-auto">{logs}</pre>
                    ) : (
                        <p className="text-gray-600 text-center">No logs available{errors.logs ? `: ${errors.logs}` : ', data may not be loaded.'}</p>
                    )}
                </section>
            </main>
        </div>
    );
}

export default SuperAdminDashboard;