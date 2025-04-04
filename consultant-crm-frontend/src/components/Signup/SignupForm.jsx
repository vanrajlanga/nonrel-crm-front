// src/components/SignupForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Axios from '../../services/api';
import './signupForm.css';

const SignupForm = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    
    try {
      console.log('Attempting signup with:', { email: userData.email, username: userData.username });
      const res = await Axios.post('/auth/signup', userData);
      
      console.log('Signup response:', res.data); // Log the response for debugging
      
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
      const username = user.username || userData.username;
      const email = user.email || userData.email;

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

      navigate('/');
    } catch (err) {
      console.error('Signup error:', err);
      console.error('Error response:', err.response?.data);
      
      // Set error message from server response
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Signup failed. Please try again.');
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2 className="signup-title">Create Account</h2>
        {error && (
          <p className="error-message">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username:</label>
            <input
              name="username"
              type="text"
              value={userData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              name="email"
              type="email"
              value={userData.email}
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
              value={userData.password}
              onChange={handleChange}
              required
              placeholder="Create a password"
            />
          </div>
          <button className="signup-button" type="submit">
            Sign Up
          </button>
        </form>
        <div className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
