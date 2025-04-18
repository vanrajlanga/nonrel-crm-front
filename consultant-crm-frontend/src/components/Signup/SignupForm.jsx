// src/components/SignupForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiArrowRight, FiAlertCircle, FiUserPlus } from 'react-icons/fi';
import Axios from '../../services/api';
import './signupForm.css';

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour

const SignupForm = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const clearAuth = () => {
      localStorage.clear();
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { isLoggedIn: false }
      }));
      window.location.href = '/login';
    };

    let inactivityTimer = setTimeout(clearAuth, INACTIVITY_TIMEOUT);
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(clearAuth, INACTIVITY_TIMEOUT);
    };

    ['mousedown', 'keydown', 'mousemove', 'touchstart'].forEach(event => 
      document.addEventListener(event, resetTimer)
    );

    return () => {
      clearTimeout(inactivityTimer);
      ['mousedown', 'keydown', 'mousemove', 'touchstart'].forEach(event => 
        document.removeEventListener(event, resetTimer)
      );
    };
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!userData.username) {
      setError('Please enter a username');
      return false;
    }
    if (!userData.email) {
      setError('Please enter your email address');
      return false;
    }
    if (!userData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!userData.password) {
      setError('Please enter a password');
      return false;
    }
    if (userData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setIsSubmitted(true);
    
    try {
      const res = await Axios.post('/auth/signup', userData);
      
      if (!res.data) {
        throw new Error('No data received from server');
      }

      const { token, role } = res.data;
      const user = res.data.user || res.data;

      if (!token || !role) {
        throw new Error('Missing required authentication data');
      }

      const username = user.username || userData.username;
      const email = user.email || userData.email;

      // Add a small delay for the success animation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Store user info in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
      localStorage.setItem('email', email);

      // Dispatch auth state change event
      const authEvent = new CustomEvent('authStateChange', {
        detail: { 
          isLoggedIn: true,
          username: username,
          email: email,
          role: role
        }
      });
      window.dispatchEvent(authEvent);

      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        navigate('/consultants');
      }

    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Signup failed. Please try again.');
      }
      setIsSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <FiUserPlus className="header-icon" />
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Join us to get started</p>
        </div>

        {error && (
          <div className="error-message" role="alert">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                id="username"
                type="text"
                name="username"
                className="form-input"
                placeholder="Choose a username"
                value={userData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <div className="input-group">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter your email"
                value={userData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                id="password"
                type="password"
                name="password"
                className="form-input"
                placeholder="Create a password"
                value={userData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            className={`signup-button ${isLoading ? 'loading' : ''}`}
            type="submit"
            disabled={isLoading}
          >
            <span className="button-content">
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>{isSubmitted ? 'Creating account...' : 'Sign Up'}</span>
                  <FiArrowRight className="button-icon" />
                </>
              )}
            </span>
          </button>
        </form>

        <div className="login-link">
          <p>
            Already have an account?
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
