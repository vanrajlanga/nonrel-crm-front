import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SecondaryNav from '../Navigation/SecondaryNav';
import { BsBell } from 'react-icons/bs';
import Axios from '../../services/api';
import './header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleBellClick = () => {
    navigate('/consultant-verification');
  };

  return (
    <>
      <header className="header">
        <div className="header__brand" onClick={() => navigate('/')}>
          <h1 className="brand-title">CRM System</h1>
        </div>

        <div className="header__search">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" id="search" x="0px" y="0px" viewBox="0 0 24 24" className="search-icon" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><g><path d="M20.031,20.79c0.46,0.46,1.17-0.25,0.71-0.7l-3.75-3.76c1.27-1.41,2.04-3.27,2.04-5.31
          c0-4.39-3.57-7.96-7.96-7.96s-7.96,3.57-7.96,7.96c0,4.39,3.57,7.96,7.96,7.96c1.98,0,3.81-0.73,5.21-1.94L20.031,20.79z
          M4.11,11.02c0-3.84,3.13-6.96,6.96-6.96c3.84,0,6.96,3.12,6.96,6.96c0,3.84-3.12,6.96-6.96,6.96C7.24,17.98,4.11,14.86,4.11,11.02
          z"></path></g></svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="header__cta">
          {isLoggedIn ? (
            <div className="user-section">
              {['teamLead', 'coordinator'].includes(userRole) && (
                <div className="notification-container">
                  <button 
                    className="notification-btn"
                    onClick={handleBellClick}
                  >
                    <BsBell />
                    {pendingCount > 0 && (
                      <span className="notification-badge">{pendingCount}</span>
                    )}
                  </button>
                </div>
              )}
              {username && (
                <span 
                  className="username" 
                  onClick={() => userRole === 'Candidate' && navigate('/my-profile')}
                  style={{ cursor: userRole === 'Candidate' ? 'pointer' : 'default' }}
                >
                  {username}
                </span>
              )}
              <button 
                className="cta-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button className="cta-button" onClick={handleGetStarted}>
              Login / Signup
            </button>
          )}
        </div>
      </header>
      <SecondaryNav />
    </>
  );
};

export default Header;
