import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle, FiUser } from 'react-icons/fi';
import Axios from '../../services/api';
import './loginForm.css';

const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour

const LoginForm = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Please enter your password');
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
      const response = await Axios.post('/auth/login', formData);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      const { token, role } = response.data;
      const user = response.data.user || response.data;

      if (!token || !role) {
        throw new Error('Missing required authentication data');
      }

      const username = user.username || '';
      const email = user.email || formData.email;

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
        window.location.href = '/consultants';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred during login');
      setIsSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FiUser className="header-icon" />
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="error-message" role="alert">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
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
                value={formData.email}
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`login-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            <span className="button-content">
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{isSubmitted ? 'Signing in...' : 'Sign In'}</span>
                  <FiArrowRight className="button-icon" />
                </>
              )}
            </span>
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?
            <Link to="/signup" className="signup-link">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
