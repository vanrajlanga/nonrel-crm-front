import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../Header/Header'
import Router from '../../Router/Routers'
import Footer from '../Footer/Footer'
import LoginForm from '../Login/LoginForm'
import SignupForm from '../Signup/SignupForm'
import './Layout.css'

const Layout = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on mount and token changes
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      return !!token;
    };

    // Initial check
    const isAuthed = checkAuth();
    
    // If authenticated and on auth pages, redirect to consultants
    if (isAuthed && (location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/consultants');
    }
    // If not authenticated and not on auth pages, redirect to login
    else if (!isAuthed && location.pathname !== '/signup' && location.pathname !== '/login') {
      navigate('/login');
    }

    // Listen for auth state changes
    const handleAuthChange = (event) => {
      const isAuthed = checkAuth();
      if (isAuthed) {
        navigate('/consultants');
      }
    };

    window.addEventListener('authStateChange', handleAuthChange);
    return () => window.removeEventListener('authStateChange', handleAuthChange);
  }, [navigate, location.pathname]);

  // Function to handle successful authentication
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    navigate('/consultants');
  };

  // If not authenticated, show only login/signup pages
  if (!isAuthenticated) {
    return (
      <div className="auth-layout">
        {location.pathname === '/signup' 
          ? <SignupForm onAuthSuccess={handleAuthSuccess} /> 
          : <LoginForm onAuthSuccess={handleAuthSuccess} />
        }
      </div>
    );
  }

  // If authenticated, show the full layout
  return (
    <div className="layout">
      <header className="layout__header">
        <Header />
      </header>
      <main className="layout__main">
        <Router />
      </main>
      <footer className="layout__footer">
        <Footer />
      </footer>
    </div>
  );
};

export default Layout;