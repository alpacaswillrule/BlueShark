import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="logo">
          <Link to="/" onClick={closeMenu}>
            <span className="logo-text">Blue Shark</span>
          </Link>
        </div>

        <button 
          className={`menu-toggle ${menuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''} 
              onClick={closeMenu}
            >
              Map
            </Link>
          </li>
          <li>
            <Link 
              to="/report" 
              className={location.pathname === '/report' ? 'active' : ''} 
              onClick={closeMenu}
            >
              Submit Rating
            </Link>
          </li>
          <li>
            <Link 
              to="/about" 
              className={location.pathname === '/about' ? 'active' : ''} 
              onClick={closeMenu}
            >
              About
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
