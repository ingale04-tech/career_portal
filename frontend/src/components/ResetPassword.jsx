import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import Navbar from './Navbar';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleResetPassword = async () => {
    setMessage('');
    console.log('Resetting password with token:', token, 'and newPassword:', newPassword);
    try {
      const response = await api.post('/auth/reset-password', null, {
        params: { token, newPassword }
      });
      console.log('API Response:', response.data);
      setMessage('Success: ' + response.data.message);
    } catch (error) {
      console.error('API Error:', error.response || error);
      const errorMsg = error.response?.data?.error || error.message;
      setMessage('Error: ' + errorMsg);
    }
  };

  return (
    <div>
  
      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Reset Password</h2>
          <p className="text-gray-600 mb-4 text-center">
            Enter your new password below.
          </p>
          <input
            type="password"
            className="w-full p-2 mb-4 border rounded"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button
            onClick={handleResetPassword}
            className="w-full bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600"
          >
            Reset Password
          </button>
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">
              Back to Login
            </Link>
          </p>
          {message && (
            <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;