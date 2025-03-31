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
    try {
      // By default, our backend assigns the role "user" if not specified.
      const res = await Axios.post('/auth/signup', userData);
      const { token, role } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2 className="signup-title">Create Account</h2>
        {error && <p className="error-message">{error}</p>}
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
