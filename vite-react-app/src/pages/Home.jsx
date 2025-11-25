import { useEffect } from "react";
import ThreeBackground from "../components/ThreeBackground";
import { useAuth } from "../context/AuthContext";
import "./../index.css";
import "./home.css";

export default function Home() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const cursor = document.querySelector(".custom-cursor");
    const moveCursor = (e) => {
      if (cursor) {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      }
    };
    document.addEventListener("mousemove", moveCursor);
    return () => document.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <div className="home-container ">
      <ThreeBackground />
      <div className="home-image home-background " />

      <div className="content relative z-10 text-gray-200">
        <div className="quote-container">
          <img
            src="/DEFO.png"
            alt="Airplane"
            className="plane-image"
          />

          <div className="quote uppercase font-bold ">
            Flight Tracker
          </div>

          <div className="author italic">
            Rastrea vuelos en tiempo real alrededor del mundo.
          </div>

          <div className="book ">
            Pulsa 'Live Map' para empezar.
          </div>
        </div>

        <a href="/map" className="live-map-link ">
          <button className="learn-more ">
            <span className="button-text">Live Map</span>
          </button>
        </a>
      </div>

      {/* Cursor solo visible en desktop */}
      <div className="custom-cursor"></div>
    </div>
  );
}
