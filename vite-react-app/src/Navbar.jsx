import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // We'll create this CSS file

function Navbar() {
    return (
        <header className="minimal-navbar">
            <div className="nav-container">
                <Link className="nav-brand" to="/">
                    <span className="nav-logo">✈</span>
                    <span className="nav-title">FlightTrack</span>
                </Link>

                <nav className="nav-links">
                    <Link className="nav-link" to="/map">
                        Live Map
                    </Link>
                </nav>
                <nav className='nav-links'>
                    <Link className="nav-link" to="/scanner">Scanner</Link>

                </nav>

                {/* Mobile menu button (hidden by default) */}
                <button className="mobile-menu-button">
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                    <span className="menu-line"></span>
                </button>
            </div>
        </header>
    );
}

export default Navbar;