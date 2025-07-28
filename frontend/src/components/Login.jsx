// src/components/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

function Login({ setIsLoggedIn, setRole, setIsApproved }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        setMessage('');
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', { email, password });
            const token = response.data.token;
            localStorage.setItem('token', token);

            // Decode token to update parent state
            const decoded = jwtDecode(token);
            setIsLoggedIn(true);
            setRole(decoded.roles[0]);
            setIsApproved(decoded.approved);

            setMessage('Login successful');
            setTimeout(() => {
                navigate('/');
            }, 1000);
        } catch (error) {
            console.error('Login error:', error.response || error);
            const errorMsg = error.response?.data?.error || error.message;
            setMessage('Error: ' + errorMsg);
        }
    };

    return (
        <div>
            <main 
                className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-8"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1585435465945-bef5a93f8849?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">Login</h2>
                    <input
                        type="email"
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        className="w-full p-2 mb-4 border rounded"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        onClick={handleLogin}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-orange-500"
                    >
                        Login
                    </button>
                    {message && (
                        <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                            {message}
                        </p>
                    )}
                    <p className="mt-4 text-center">
                        <Link to="/forgot-password" className="text-blue-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Login;