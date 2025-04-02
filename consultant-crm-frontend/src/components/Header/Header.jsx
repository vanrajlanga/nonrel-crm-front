import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SecondaryNav from '../Navigation/SecondaryNav';
import './header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token); // Convert token to boolean
    };
    
    checkLoginStatus();
    // Add event listener for storage changes
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // You can implement search logic here
  };

  return (
    <>
      <header className="header">
        <div className="header__brand">
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
            <button 
              className="cta-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <button className="cta-button" onClick={handleGetStarted}>
              Get Started
            </button>
          )}
        </div>
      </header>
      <SecondaryNav />
    </>
  );
};

export default Header;
