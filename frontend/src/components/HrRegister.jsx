import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function HrRegister() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Validation functions
  const validateFullName = (name) => {
    if (!name) return 'Full Name is required.';
    if (name.length < 2 || name.length > 50) return 'Full Name must be between 2 and 50 characters.';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Full Name can only contain letters and spaces.';
    return '';
  };

  const validateEmail = (email) => {
    if (!email) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
    }
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return 'Phone Number is required.';
    if (!/^\d{10}$/.test(phone)) return 'Phone Number must be exactly 10 digits.';
    return '';
  };

  // Handle input changes with real-time validation
  const handleInputChange = (field, value, setter) => {
    setter(value);
    let error = '';
    switch (field) {
      case 'fullName':
        error = validateFullName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Validate all fields before submission
  const validateForm = () => {
    const fullNameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const phoneError = validatePhone(phone);

    setErrors({
      fullName: fullNameError,
      email: emailError,
      password: passwordError,
      phone: phoneError,
    });

    return !(fullNameError || emailError || passwordError || phoneError);
  };

  const handleRegister = async () => {
    setMessage('');

    if (!validateForm()) {
      setMessage('Error: Please fix the errors in the form before submitting.');
      return;
    }

    console.log('Registering HR:', { fullName, email, phone });
    try {
      const response = await api.post('/auth/register/hr', {
        fullName,
        email,
        password,
        phone,
      });
      console.log('Full API Response:', response);
      localStorage.setItem('token', response.data.token);
      setMessage(response.data.message || 'Registration successful!');
      setTimeout(() => {
        navigate('/hr/dashboard');
      }, 1500);
    } catch (error) {
      console.error('API Error:', error.response || error);
      const errorMsg = error.response?.data?.error || error.message;
      setMessage('Error: ' + errorMsg);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div>
      <main 
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-8"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">HR Registration</h2>
          <p className="text-gray-600 mb-6 text-center">
            Sign up as HR to post job openings.
          </p>
          <div className="mb-4">
            <input
              type="text"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value, setFullName)}
            />
            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>
          <div className="mb-4">
            <input
              type="email"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Email"
              value={email}
              onChange={(e) => handleInputChange('email', e.target.value, setEmail)}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } pr-10`}
                placeholder="Password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value, setPassword)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>
          <div className="mb-6">
            <input
              type="tel"
              className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:border-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Phone Number (10 digits)"
              value={phone}
              onChange={(e) => handleInputChange('phone', e.target.value, setPhone)}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
          <button
            onClick={handleRegister}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-orange-500 transition-colors duration-200"
          >
            Register
          </button>
          {message && (
            <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
          <p className="mt-4 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default HrRegister;