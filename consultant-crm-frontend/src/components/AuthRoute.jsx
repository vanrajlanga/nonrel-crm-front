import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = (event) => {
      setIsLoggedIn(event.detail.isLoggedIn);
    };

    window.addEventListener('authStateChange', handleAuthChange);
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  // If user is logged in, redirect to home page
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // If user is not logged in, show the requested auth page (login/signup)
  return children;
};

export default AuthRoute; 