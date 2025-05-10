import React, { useState } from "react";
import { useUserPreferences } from "../../src/hooks/useUserPreferences";
import { DEFAULT_FILTERS, MAP_THEMES } from "../constants/map";
import PropTypes from 'prop-types';
import '../styles/card.css';
const FiltersSection = ({ filters, onFiltersChange, onClose }) => {
    const [localFilters, setLocalFilters] = useState({
        airlineCode: filters?.airlineCode || "",
        airportCode: filters?.airportCode || ""
    });

    const handleApply = () => {
        onFiltersChange({
            airlineCode: localFilters.airlineCode.toUpperCase(),
            airportCode: localFilters.airportCode.toUpperCase()
        });
        onClose();
    };

    return (
        <div className="mb-4">
            <h5 className="text-primary mb-3">Filtros por Código</h5>
            
            {/* Input Aerolínea */}
            <div className="mb-3">
                <label className="form-label">Aerolínea (ej: IB, BA)</label>
                <input
                    type="text"
                    className="form-control"
                    value={localFilters.airlineCode}
                    onChange={(e) => 
                        setLocalFilters({
                            ...localFilters, 
                            airlineCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                        })
                    }
                    maxLength={3}
                    placeholder="Primeras letras del callsign"
                />
            </div>

            {/* Input Aeropuerto */}
            <div className="mb-3">
                <label className="form-label">Aeropuerto (ej: MAD, JFK)</label>
                <input
                    type="text"
                    className="form-control"
                    value={localFilters.airportCode}
                    onChange={(e) => 
                        setLocalFilters({
                            ...localFilters, 
                            airportCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                        })
                    }
                    maxLength={3}
                    placeholder="Últimas letras del callsign"
                />
            </div>

            <button className="btn btn-primary mt-2" onClick={handleApply}>
                Aplicar Filtros
            </button>
        </div>
    );
};


const ThemeSection = ({ theme, onThemeChange, onApplyTheme }) => (
    <div className="mb-4">
        <h5 className="text-primary mb-3">Tema del mapa</h5>
        <select
            className="form-select"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
        >
            {Object.entries(MAP_THEMES).map(([key, value]) => (
                <option key={key} value={value}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
            ))}
        </select>
        <button className="btn btn-primary mt-2" onClick={onApplyTheme}>
            Aplicar Tema
        </button>
    </div>
);

export default function PreferencesPanel({ onClose, onThemeApplied }) {
    const { preferences, savePreferences } = useUserPreferences();
    const [currentTheme, setCurrentTheme] = useState(preferences?.theme || MAP_THEMES.light);

    const handleThemeChange = (newTheme) => {
        setCurrentTheme(newTheme);
    };
const handleApplyTheme = () => {
    // Find the theme KEY that matches the URL
    const themeKey = Object.keys(MAP_THEMES).find(
        key => MAP_THEMES[key] === currentTheme
    );
    
    if (themeKey) {
        savePreferences({ theme: themeKey }); // Save the KEY, not the URL
        onThemeApplied(themeKey);
    } else {
        console.error('Invalid theme URL selected:', currentTheme);
    }
};

    const handleFiltersChange = (newFilters) => {
        savePreferences({ filters: newFilters });
    };

    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose}></div>
            <div className="modal d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content shadow-lg">
                        <div className="modal-header">
                            <h4 className="modal-title">Preferencias</h4>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar"></button>
                        </div>
                        <div className="modal-body">
                            <ThemeSection 
                                theme={currentTheme}
                                onThemeChange={handleThemeChange}
                                onApplyTheme={handleApplyTheme}
                            />
                            <FiltersSection 
                                filters={preferences?.filters || DEFAULT_FILTERS} 
                                onFiltersChange={handleFiltersChange}
                                onClose={onClose}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

FiltersSection.propTypes = {
    filters: PropTypes.shape({
        originCountry: PropTypes.string,
        destCountry: PropTypes.string,
    }),
    onFiltersChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

ThemeSection.propTypes = {
    theme: PropTypes.string.isRequired,
    onThemeChange: PropTypes.func.isRequired,
    onApplyTheme: PropTypes.func.isRequired,
};

PreferencesPanel.propTypes = {
    onClose: PropTypes.func.isRequired,
    onThemeApplied: PropTypes.func.isRequired,
};