import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
          <NavLink to="/" onClick={closeMenu}>
            <span className="logo-text">Blue Shark</span>
          </NavLink>
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
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'active' : ''} 
              onClick={closeMenu}
            >
              Map
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/report" 
              className={({ isActive }) => isActive ? 'active' : ''} 
              onClick={closeMenu}
            >
              Submit Rating
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/resources" 
              className={({ isActive }) => isActive ? 'active' : ''} 
              onClick={closeMenu}
            >
              Resources
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/about" 
              className={({ isActive }) => isActive ? 'active' : ''} 
              onClick={closeMenu}
            >
              About
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
