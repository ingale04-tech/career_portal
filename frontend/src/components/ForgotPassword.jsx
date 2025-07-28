import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');

  const handleForgotPassword = async () => {
    setMessage('');
    setToken('');
    console.log('Submitting email:', email);
    try {
      const response = await api.post('/auth/forgot-password', null, {
        params: { email }
      });
      console.log('API Response:', response.data);
      setToken(response.data.token);
      setMessage(`Success: ${response.data.message}`);
    } catch (error) {
      console.error('API Error:', error.response || error);
      const errorMsg = error.response?.data?.error || error.message;
      setMessage('Error: ' + errorMsg);
    }
  };

  return (
    <div>
      <main 
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-8"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1512950050685-b1d4ae63d2df?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Forgot Password</h2>
          <p className="text-gray-600 mb-4 text-center">
            Enter your email to receive a password reset token.
          </p>
          <input
            className="w-full p-2 mb-4 border rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleForgotPassword}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-orange-500"
          >
            Send Reset Token
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
          {token && (
            <p className="mt-4 text-center text-green-500">
              Token generated!{' '}
              <Link
                to={`/reset-password?token=${token}`}
                className="text-blue-600 hover:underline"
              >
                Click here to reset your password
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;