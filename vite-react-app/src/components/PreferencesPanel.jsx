import React, { useState } from "react";
import { debounce } from "lodash";
import { useUserPreferences } from "../../src/hooks/useUserPreferences";


// Componente de Filtros
const FiltersSection = ({ filters, onFiltersChange }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleFilterChange = (key, value) => {
        setLocalFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const applyFiltersWithDebounce = debounce(() => {
        onFiltersChange(localFilters);
    }, 500);

    return (
        <div className="preferences-section">
            <h4>Filtros</h4>
            <div className="filter-group">
                <label>Altitud mínima (ft)</label>
                <input
                    type="number"
                    value={localFilters.minAltitude}
                    onChange={(e) => handleFilterChange("minAltitude", parseInt(e.target.value))}
                />
            </div>

            <div className="filter-group">
                <label>Altitud máxima (ft)</label>
                <input
                    type="number"
                    value={localFilters.maxAltitude}
                    onChange={(e) => handleFilterChange("maxAltitude", parseInt(e.target.value))}
                />
            </div>

            <button className="apply-btn" onClick={applyFiltersWithDebounce}>
                Aplicar filtros
            </button>
        </div>
    );
};

// Componente del Tema
const ThemeSection = ({ theme, onThemeChange }) => (
    <div className="preferences-section">
        <h4>Tema del mapa</h4>
        <select value={theme} onChange={(e) => onThemeChange(e.target.value)}>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="satellite">Satélite</option>
        </select>
    </div>
);

export default function PreferencesPanel({ onClose }) {
    const { preferences, savePreferences } = useUserPreferences();

    const handleThemeChange = (newTheme) => {
        savePreferences({ theme: newTheme });
    };

    const handleFiltersChange = (newFilters) => {
        savePreferences({ filters: newFilters });
        onClose();
    };

    return (
        <div className="preferences-panel">
            <div className="preferences-header">
                <h3>Preferencias</h3>
                <button onClick={onClose}>×</button>
            </div>

            <ThemeSection theme={preferences.theme} onThemeChange={handleThemeChange} />
            <FiltersSection filters={preferences.filters} onFiltersChange={handleFiltersChange} />
        </div>
    );
}
