import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';

import './Layout.css';

export default function Layout() {
    const [navbarVisible, setNavbarVisible] = useState(true);

    return (
        <div className="app-layout">
        
            <Navbar visible={navbarVisible} setVisible={setNavbarVisible} />
            <main className={`content-area ${navbarVisible ? '' : 'navbar-hidden'}`}>
                <Outlet />
            </main>
        </div>
    );
}