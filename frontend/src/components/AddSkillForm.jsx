// frontend/src/components/AddSkillForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddSkillForm = ({ token, onSkillAdded }) => {
    const [newSkill, setNewSkill] = useState('');
    const [skillLoading, setSkillLoading] = useState(false);
    const [skillError, setSkillError] = useState('');
    const [existingSkills, setExistingSkills] = useState([]);
    const [primarySkill, setPrimarySkill] = useState('');

    // Fetch existing skills and primary skill to validate against duplicates
    const fetchSkills = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/applications/applicant-details', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExistingSkills((response.data.skills || []).map(skill => skill.toLowerCase()));
            setPrimarySkill(response.data.primarySkill || '');
        } catch (err) {
            console.error('Error fetching skills for validation:', err);
            toast.error('Failed to load existing skills for validation.');
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [token]);

    const handleSkillChange = (e) => {
        const value = e.target.value;
        setNewSkill(value);

        const normalizedSkill = value.trim().toLowerCase();
        if (!value.trim()) {
            setSkillError('Skill cannot be empty.');
        } else if (primarySkill.toLowerCase() === normalizedSkill) {
            setSkillError('This skill is already set as your primary skill.');
        } else if (existingSkills.includes(normalizedSkill)) {
            setSkillError('This skill already exists in your skills list.');
        } else {
            setSkillError('');
        }
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) {
            toast.error('Skill cannot be empty.');
            return;
        }

        const normalizedSkill = newSkill.trim().toLowerCase();
        if (primarySkill.toLowerCase() === normalizedSkill) {
            toast.error('This skill is already set as your primary skill.');
            return;
        }
        if (existingSkills.includes(normalizedSkill)) {
            toast.error('This skill already exists in your skills list.');
            return;
        }

        setSkillLoading(true);
        try {
            const response = await axios.post(
                'http://localhost:8080/api/applications/skills',
                null,
                {
                    params: { skill: newSkill },
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            toast.success(response.data.message || 'Skill added successfully!');
            setNewSkill('');
            setSkillError('');
            await fetchSkills(); // Update local state
            if (onSkillAdded) {
                onSkillAdded(); // Notify parent to refetch applicant details
            }
        } catch (err) {
            console.error('Error adding skill:', err);
            const errorMessage = err.response?.data?.error || 'Failed to add skill. Please try again.';
            toast.error(errorMessage);
        } finally {
            setSkillLoading(false);
        }
    };

    return (
        <div className="flex space-x-4 items-center">
            <div className="flex-1">
                <input
                    type="text"
                    value={newSkill}
                    onChange={handleSkillChange}
                    placeholder="Enter a new skill (e.g., JavaScript)"
                    className={`w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        skillError ? 'border-red-500' : ''
                    }`}
                />
                {skillError && (
                    <p className="text-red-500 text-sm mt-1">{skillError}</p>
                )}
            </div>
            <button
                onClick={handleAddSkill}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                disabled={skillLoading || skillError}
            >
                {skillLoading ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 mr-2 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Adding...
                    </>
                ) : (
                    'Add Skill'
                )}
            </button>
        </div>
    );
};

export default AddSkillForm;