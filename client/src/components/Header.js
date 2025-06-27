import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <h1>🏄‍♂️ SurfCast</h1>
          <span className="tagline">California Surf Forecast</span>
        </div>
        <nav className="nav">
          <a href="/" className="nav-link">Home</a>
          <a href="#about" className="nav-link">About</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;