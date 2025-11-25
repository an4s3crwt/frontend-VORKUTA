import React, { useState, useEffect } from "react";

const AIRLINES = ["IB", "AA", "BA", "LH", "AF"];
const THEMES = ["light", "dark", "satellite"];
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica",
  "Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark",
  "Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia",
  "Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti",
  "Holy See","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan",
  "Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania",
  "Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique",
  "Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria",
  "North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine State","Panama",
  "Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa",
  "San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone",
  "Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan",
  "Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Tajikistan","Tanzania",
  "Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay",
  "Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const PreferencesPanel = ({ filters, onFiltersChange, onResetFilters, theme, onThemeChange, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [countryQuery, setCountryQuery] = useState(filters.country || "");
  const [showCountryList, setShowCountryList] = useState(false);

  // 🔁 Sincronizar si cambian los filtros externos
  useEffect(() => {
    setLocalFilters(filters);
    setCountryQuery(filters.country || "");
  }, [filters]);

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countryQuery.toLowerCase())
  );

  const handleApply = () => {
    onFiltersChange(localFilters);
    setShowCountryList(false);
  };

  const handleReset = () => {
    const empty = { airlineCode: "", country: "" };
    setLocalFilters(empty);
    setCountryQuery("");
    onResetFilters();
  };

  const handleCountrySelect = (country) => {
    setCountryQuery(country);
    setLocalFilters({ ...localFilters, country });
    setShowCountryList(false); // ✅ cerrar al seleccionar
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleApply(); // ✅ aplicar con Enter
  };

  return (
    <div className="preferences-panel bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 space-y-4 animate-fadeIn max-w-xs">
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl font-bold"
        onClick={onClose}
        aria-label="Cerrar panel"
      >
        ×
      </button>

      {/* Aerolínea */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Aerolínea</label>
        <select
          value={localFilters.airlineCode}
          onChange={e => setLocalFilters({ ...localFilters, airlineCode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">Todas</option>
          {AIRLINES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* País con búsqueda */}
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-600 mb-1">País</label>
        <input
          type="text"
          placeholder="Escribe para buscar..."
          value={countryQuery}
          onChange={e => {
            const val = e.target.value;
            setCountryQuery(val);
            setLocalFilters({ ...localFilters, country: val });
            setShowCountryList(true);
          }}
          onFocus={() => setShowCountryList(true)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
        {showCountryList && countryQuery && (
          <ul className="absolute z-50 mt-1 max-h-40 w-full overflow-auto bg-white border border-gray-300 rounded-xl shadow-lg">
            {filteredCountries.length > 0 ? (
              filteredCountries.slice(0, 10).map(c => (
                <li
                  key={c}
                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleCountrySelect(c)}
                >
                  {c}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-gray-400">No hay coincidencias</li>
            )}
          </ul>
        )}
      </div>

      {/* Tema */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">Tema</label>
        <select
          value={theme}
          onChange={e => onThemeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        >
          <option value="">Selecciona un tema</option>
          {THEMES.map(t => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Botones */}
      <div className="flex space-x-3 mt-3">
        <button
          onClick={handleReset}
          className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-black text-white rounded-xl hover:opacity-90 transition"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};

export default PreferencesPanel;
