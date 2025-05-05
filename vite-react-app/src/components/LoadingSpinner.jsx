import React from "react";
import "./LoadingSpinner.css";

export default function LoadingSpinner({ fullPage = false }) {
    return (
        <div className={`spinner-container ${fullPage ? "full-page" : ""}`}>
            <div className="loading-spinner"></div>
        </div>
    );
}