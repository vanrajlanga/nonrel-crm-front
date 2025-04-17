import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SecondaryNav from '../Navigation/SecondaryNav';
import { BsBell, BsPersonCircle } from 'react-icons/bs';
import Axios from '../../services/api';
import './header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [pendingCount, setPendingCount] = useState(0);

  // Add token expiration check
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      
      if (token && tokenTimestamp) {
        const currentTime = new Date().getTime();
        const tokenTime = parseInt(tokenTimestamp);
        const threeHoursInMs = 1 * 60 * 60 * 1000; // 3 hours in milliseconds
        
        if (currentTime - tokenTime > threeHoursInMs) {
          // Token expired, clear all auth data
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('username');
          localStorage.removeItem('email');
          localStorage.removeItem('tokenTimestamp');
          
          const authEvent = new CustomEvent('authStateChange', {
            detail: { 
              isLoggedIn: false,
              username: '',
              email: '',
              role: ''
            }
          });
          window.dispatchEvent(authEvent);
          
          setIsLoggedIn(false);
          setUsername('');
          navigate('/');
        }
      }
    };

    // Check token expiration every minute
    const interval = setInterval(checkTokenExpiration, 60000);
    
    // Initial check
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [navigate]);

  const refreshPendingCount = async () => {
    const userRole = localStorage.getItem('role');
    if (userRole === 'teamLead' || userRole === 'coordinator') {
      try {
        const response = await Axios.get('/consultants/pending-verifications');
        setPendingCount(response.data.count);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const storedUsername = localStorage.getItem('username');
      const storedRole = localStorage.getItem('role');
      setIsLoggedIn(!!token);
      setUsername(storedUsername || '');
      setUserRole(storedRole || '');
    };

    checkLoginStatus();

    const handleAuthChange = (event) => {
      setIsLoggedIn(event.detail.isLoggedIn);
      if (event.detail.isLoggedIn) {
        setUsername(event.detail.username);
        setUserRole(event.detail.role);
        // Store token timestamp when user logs in
        localStorage.setItem('tokenTimestamp', new Date().getTime().toString());
      } else {
        setUsername('');
        setUserRole('');
      }
    };

    const handleVerificationChange = () => {
      refreshPendingCount();
    };

    window.addEventListener('authStateChange', handleAuthChange);
    window.addEventListener('storage', checkLoginStatus);
    window.addEventListener('verificationStatusChange', handleVerificationChange);

    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('verificationStatusChange', handleVerificationChange);
    };
  }, []);

  // Fetch pending verifications for teamLead and coordinator
  useEffect(() => {
    if (isLoggedIn) {
      refreshPendingCount();
      // Refresh every 30 seconds
      const interval = setInterval(refreshPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('tokenTimestamp');
    
    const authEvent = new CustomEvent('authStateChange', {
      detail: { 
        isLoggedIn: false,
        username: '',
        email: '',
        role: ''
      }
    });
    window.dispatchEvent(authEvent);
    
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  const handleBellClick = () => {
    navigate('/consultant-verification');
  };

  return (
    <>
      <motion.header 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="header__brand" 
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.h1 
            className="brand-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            CRM System
          </motion.h1>
        </motion.div>

        <motion.div 
          className="header__cta"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            {isLoggedIn ? (
              <motion.div 
                className="user-section"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {['teamLead', 'coordinator'].includes(userRole) && (
                  <motion.div 
                    className="notification-container"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <button 
                      className="notification-btn"
                      onClick={handleBellClick}
                    >
                      <BsBell />
                      {pendingCount > 0 && (
                        <motion.span 
                          className="notification-badge"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {pendingCount}
                        </motion.span>
                      )}
                    </button>
                  </motion.div>
                )}
                {username && (
                  <motion.div 
                    className="username-wrapper"
                    whileHover={{ scale: 1.05 }}
                  >
                    <BsPersonCircle className="user-icon" />
                    <span 
                      className="username" 
                      onClick={() => userRole === 'Candidate' && navigate('/my-profile')}
                      style={{ cursor: userRole === 'Candidate' ? 'pointer' : 'default' }}
                    >
                      {username}
                    </span>
                  </motion.div>
                )}
                <motion.button 
                  className="cta-button"
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Logout
                </motion.button>
              </motion.div>
            ) : (
              <motion.button 
                className="cta-button"
                onClick={handleGetStarted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login / Signup
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>
      <SecondaryNav />
    </>
  );
};

export default Header;
