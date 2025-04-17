import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      path: '/consultants',
      icon: (
        <motion.svg 
          whileHover={{ scale: 1.1 }}
          stroke="currentColor" 
          fill="currentColor" 
          strokeWidth="0" 
          viewBox="0 0 24 24" 
          height="1.2em" 
          width="1.2em" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M13 4.069V2h-2v2.069A8.008 8.008 0 0 0 4.069 11H2v2h2.069A8.007 8.007 0 0 0 11 19.931V22h2v-2.069A8.007 8.007 0 0 0 19.931 13H22v-2h-2.069A8.008 8.008 0 0 0 13 4.069zM12 18c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6z"></path>
        </motion.svg>
      ),
      label: 'Consultants'
    },
    {
      path: '/companies',
      icon: (
        <motion.svg 
          whileHover={{ scale: 1.1 }}
          stroke="currentColor" 
          fill="currentColor" 
          strokeWidth="0" 
          viewBox="0 0 24 24" 
          height="1.2em" 
          width="1.2em" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14 14.252V16.3414C13.3744 16.1203 12.7013 16 12 16C8.68629 16 6 18.6863 6 22H4C4 17.5817 7.58172 14 12 14C12.6906 14 13.3608 14.0875 14 14.252ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13Z"></path>
        </motion.svg>
      ),
      label: 'Companies'
    },
    {
      path: '/registration',
      icon: (
        <motion.svg 
          whileHover={{ scale: 1.1 }}
          stroke="currentColor" 
          fill="currentColor" 
          strokeWidth="0" 
          viewBox="0 0 24 24" 
          height="1.2em" 
          width="1.2em" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 5.52 0 10-4.48 10-10 0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h2v2h-2v2h-2v-2H9v-2h2V7z"></path>
        </motion.svg>
      ),
      label: 'Registration'
    }
    // Add more navigation items as needed
  ];

  return (
    <motion.nav 
      className="secondary-nav"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="secondary-nav-list-wrapper">
        <motion.ul 
          className="secondary-nav-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {navItems.map((item, index) => (
            <motion.li 
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
            >
              <Link
                to={item.path}
                className={isActive(item.path) ? 'active-nav-button' : 'secondary-nav-link'}
              >
                <motion.div
                  className="nav-icon-wrapper"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.icon}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.nav>
  );
};

export default SecondaryNav;
