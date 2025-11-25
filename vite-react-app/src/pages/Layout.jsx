import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import './Layout.css'; // Contendrá también el estilo del cursor

export default function Layout() {
  const [navbarVisible, setNavbarVisible] = useState(true);

  useEffect(() => {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) return;

    const moveCursor = (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const enlarge = () => cursor.classList.add('cursor-hover');
    const shrink = () => cursor.classList.remove('cursor-hover');

    document.addEventListener('mousemove', moveCursor);
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', enlarge);
      el.addEventListener('mouseleave', shrink);
    });

    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.querySelectorAll('a, button').forEach((el) => {
        el.removeEventListener('mouseenter', enlarge);
        el.removeEventListener('mouseleave', shrink);
      });
    };
  }, []);

  return (
    <div className="app-layout">
      <Navbar visible={navbarVisible} setVisible={setNavbarVisible} />
      <main className={`content-area ${navbarVisible ? '' : 'navbar-hidden'}`}>
        <Outlet />
      </main>

      {/* Cursor global */}
      <div className="custom-cursor"></div>
    </div>
  );
}
