import React, { useState } from "react";
import { debounce } from "lodash";
import { useUserPreferences } from "../../src/hooks/useUserPreferences";
import '../styles/card.css'; 

// Sección de Filtros con Bootstrap
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
        <div className="mb-4">
            <h5 className="text-primary mb-3">Filtros</h5>

            <div className="mb-3">
                <label className="form-label">Altitud mínima (ft)</label>
                <input
                    type="number"
                    className="form-control"
                    value={localFilters.minAltitude}
                    onChange={(e) => handleFilterChange("minAltitude", parseInt(e.target.value))}
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Altitud máxima (ft)</label>
                <input
                    type="number"
                    className="form-control"
                    value={localFilters.maxAltitude}
                    onChange={(e) => handleFilterChange("maxAltitude", parseInt(e.target.value))}
                />
            </div>

            <button className="btn btn-outline-primary" onClick={applyFiltersWithDebounce}>
                Aplicar filtros
            </button>
        </div>
    );
};

// Sección de Tema con Bootstrap
const ThemeSection = ({ theme, onThemeChange }) => (
    <div className="mb-4">
        <h5 className="text-primary mb-3">Tema del mapa</h5>
        <select
            className="form-select"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
        >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="satellite">Satélite</option>
        </select>
    </div>
);

// Panel completo con Bootstrap
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
        <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg">
                    <div className="modal-header">
                        <h4 className="modal-title">Preferencias</h4>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <ThemeSection theme={preferences.theme} onThemeChange={handleThemeChange} />
                        <FiltersSection filters={preferences.filters} onFiltersChange={handleFiltersChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}
