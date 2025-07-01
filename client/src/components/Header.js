import React from 'react'; // Import React library
import './Header.css'; // Import css file

const Header = () => { // Defines functional component called Header
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

export default Header; // Exports Header component so other files can import and use it