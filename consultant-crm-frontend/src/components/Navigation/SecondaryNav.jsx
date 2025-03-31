import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SecondaryNav.css';

const SecondaryNav = () => {
  const location = useLocation();

  // Check if the current path is active (exact match or sub-path)
  const isActive = (path) => {
    // Special case for home to avoid it being active for all paths
    if (path === '/home') {
      return location.pathname === '/home';
    }
    // Check if current path starts with the navigation item path
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/home',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 21C13.4477 21 13 20.5523 13 20V12C13 11.4477 13.4477 11 14 11H20C20.5523 11 21 11.4477 21 12V20C21 20.5523 20.5523 21 20 21H14ZM4 13C3.44772 13 3 12.5523 3 12V4C3 3.44772 3.44772 3 4 3H10C10.5523 3 11 3.44772 11 4V12C11 12.5523 10.5523 13 10 13H4ZM9 11V5H5V11H9ZM4 21C3.44772 21 3 20.5523 3 20V16C3 15.4477 3.44772 15 4 15H10C10.5523 15 11 15.4477 11 16V20C11 20.5523 10.5523 21 10 21H4ZM5 19H9V17H5V19ZM15 19H19V13H15V19ZM13 4C13 3.44772 13.4477 3 14 3H20C20.5523 3 21 3.44772 21 4V8C21 8.55228 20.5523 9 20 9H14C13.4477 9 13 8.55228 13 8V4ZM15 5V7H19V5H15Z"></path></svg>,
      label: 'Dashboard'
    },
    {
      path: '/consultants',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3"></circle><path d="M13 4.069V2h-2v2.069A8.008 8.008 0 0 0 4.069 11H2v2h2.069A8.007 8.007 0 0 0 11 19.931V22h2v-2.069A8.007 8.007 0 0 0 19.931 13H22v-2h-2.069A8.008 8.008 0 0 0 13 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"></path></svg>,
      label: 'Consultants'
    },
    {
      path: '/projects',
      icon: <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 14.252V16.3414C13.3744 16.1203 12.7013 16 12 16C8.68629 16 6 18.6863 6 22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z"></path></svg>,
      label: 'Projects'
    },
    {
        path: '/registration',
        icon: <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 5.52 0 10-4.48 10-10 0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h2v2h-2v2h-2v-2H9v-2h2V7z"></path></svg>,
        label: 'Registration'
    }
    // Add more navigation items as needed
  ];

  return (
    <nav className="secondary-nav">
      <div className="secondary-nav-list-wrapper">
        <ul className="secondary-nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={isActive(item.path) ? 'active-nav-button' : 'secondary-nav-link'}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default SecondaryNav;
