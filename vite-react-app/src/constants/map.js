export const CACHE_KEYS = {
    FLIGHT_DATA: 'flightDataCache',
    LAST_FETCH: 'lastFlightDataFetch',
    AIRCRAFT_IMAGES: 'aircraftImagesCache',
    AIRCRAFT_DATA: 'aircraftDataCache',
    USER_PREFERENCES: 'userPreferencesCache'
};

export const MAP_THEMES = {
    light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
};
export const DEFAULT_FILTERS = {
   originCountry: "",
  destCountry: "",
};

export const DEFAULT_AIRCRAFT_DATA = {
    ICAOTypeCode: "",
    Manufacturer: "Unknown",
    ModeS: "",
    OperatorFlagCode: "",
    RegisteredOwners: "Unknown",
    Registration: "",
    Type: "",
};
