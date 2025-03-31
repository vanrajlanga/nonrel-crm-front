import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__content">
        {/* Left section: Links */}
        <div className="footer__links">
          <ul>
            <li><a href="/privacy">Privacy Policy</a></li>
            <li><a href="/terms">Terms of Use</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </div>

        {/* Right section: Branding or copyright */}
        <div className="footer__brand">
          <p>© 2025 CRM System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
