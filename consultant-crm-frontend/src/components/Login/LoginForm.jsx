import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Axios from '../../services/api';
import './loginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    
    try {
      console.log('Attempting login with:', { email: credentials.email });
      const res = await Axios.post('/auth/login', credentials);
      
      console.log('Login response:', res.data); // Log the response for debugging
      
      // Check if we have a response and data
      if (!res.data) {
        throw new Error('No data received from server');
      }

      // Extract user data from response
      const { token, role } = res.data;
      const user = res.data.user || res.data; // Try both locations for user data

      if (!token || !role) {
        throw new Error('Missing required authentication data');
      }

      // Get username with fallbacks
      const username = user.username || user.name || user.email?.split('@')[0] || 'User';
      const email = user.email || credentials.email;

      // Store user info in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);
      
      // Dispatch auth state change event with username
      const authEvent = new CustomEvent('authStateChange', {
        detail: { 
          isLoggedIn: true,
          username: username,
          email: email,
          role: role
        }
      });
      window.dispatchEvent(authEvent);
      
      // Navigate to home
      navigate('/');
      
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      // Set error message from server response
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="login-title">Welcome Back</h2>
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>
          <button className="login-button" type="submit">
            Login
          </button>
        </form>
        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
