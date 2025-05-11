import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useUserPreferences } from "../../src/hooks/useUserPreferences";
import { DEFAULT_FILTERS, MAP_THEMES } from "../constants/map";

const FiltersSection = ({ filters, onFiltersChange }) => {
    const [localFilters, setLocalFilters] = useState({
        airlineCode: filters?.airlineCode || "",
        airportCode: filters?.airportCode || ""
    });

    const handleApply = () => {
        onFiltersChange({
            airlineCode: localFilters.airlineCode.toUpperCase(),
            airportCode: localFilters.airportCode.toUpperCase()
        });
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-sm text-gray-600">Aerolínea (ej: IB)</label>
                <input
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                    type="text"
                    value={localFilters.airlineCode}
                    onChange={(e) =>
                        setLocalFilters({
                            ...localFilters,
                            airlineCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                        })
                    }
                    maxLength={3}
                />
            </div>
            <div>
                <label className="text-sm text-gray-600">Aeropuerto (ej: MAD)</label>
                <input
                    className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                    type="text"
                    value={localFilters.airportCode}
                    onChange={(e) =>
                        setLocalFilters({
                            ...localFilters,
                            airportCode: e.target.value.toUpperCase().replace(/[^A-Z]/g, "")
                        })
                    }
                    maxLength={3}
                />
            </div>
            <button className="w-full bg-black text-white py-2 rounded-md" onClick={handleApply}>
                Aplicar Filtros
            </button>
        </div>
    );
};

const ThemeSection = ({ theme, onThemeChange, onApplyTheme }) => (
    <div className="space-y-3">
        <label className="text-sm text-gray-600">Tema del mapa</label>
        <select
            className="w-full px-3 py-2 border rounded-md bg-white text-sm"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
        >
            {Object.entries(MAP_THEMES).map(([key, value]) => (
                <option key={key} value={value}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
            ))}
        </select>
        <button className="w-full bg-black text-white py-2 rounded-md" onClick={onApplyTheme}>
            Aplicar Tema
        </button>
    </div>
);

export default function PreferencesPanel({ onClose, onThemeApplied, onFiltersChange }) {
    const panelRef = useRef();
    const { preferences, savePreferences } = useUserPreferences();
    const [currentTheme, setCurrentTheme] = useState(preferences?.theme || MAP_THEMES.light);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleApplyTheme = () => {
        const themeKey = Object.keys(MAP_THEMES).find(key => MAP_THEMES[key] === currentTheme);
        if (themeKey) {
            savePreferences({ theme: themeKey });
            onThemeApplied(themeKey);
        }
    };

    const handleFilters = (newFilters) => {
        savePreferences({ filters: newFilters });
        onFiltersChange(newFilters);
    };

    return (
        <div className="fixed top-16 right-4 w-80 bg-white border shadow-xl rounded-xl p-6 z-50" ref={panelRef}>
            <h4 className="text-xl font-semibold mb-4 text-gray-800">Preferencias</h4>
            <ThemeSection
                theme={currentTheme}
                onThemeChange={setCurrentTheme}
                onApplyTheme={handleApplyTheme}
            />
            <hr className="my-4" />
            <FiltersSection
                filters={preferences?.filters || DEFAULT_FILTERS}
                onFiltersChange={handleFilters}
            />
        </div>
    );
}

PreferencesPanel.propTypes = {
    onClose: PropTypes.func.isRequired,
    onThemeApplied: PropTypes.func.isRequired,
    onFiltersChange: PropTypes.func.isRequired
};
