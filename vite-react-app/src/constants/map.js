// =============================================================================
// MIS CONSTANTES: Aquí guardo todo lo que no quiero repetir por el código
// =============================================================================

// 1. CLAVES PARA LA MEMORIA (CACHÉ)
// Aquí defino los nombres que uso para guardar cosas en el navegador.
// Lo hago así para no tener que escribir "flightDataCache" de memoria cada vez
// y evitar líos si me equivoco en una letra
export const CACHE_KEYS = {
  FLIGHT_DATA: "flightDataCache",       // Para guardar los vuelos y que cargue rápido
  LAST_FETCH: "lastFlightDataFetch",    // Para saber cuándo actualicé por última vez
  AIRCRAFT_IMAGES: "aircraftImagesCache", // Para no bajar las mismas fotos mil veces
  AIRCRAFT_DATA: "aircraftDataCache",     // Info de los aviones que ya hemos visto
  USER_PREFERENCES: "userPreferencesCache", // Si el usuario prefiere modo oscuro, se queda guardado
};

// 2. TEMAS DEL MAPA
// Son las direcciones web (URLs) que pintan el mapa de fondo.
export const MAP_THEMES = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", // El clásico, se ve bien de día
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", // Modo oscuro, cansa menos la vista
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", // Vista realista desde satélite
};

// 3. FILTROS POR DEFECTO
// Así es como empieza la búsqueda cuando entras a la web.
// Lo pongo todo vacío ("") para que al principio salgan TODOS los vuelos
// y no esté filtrando nada raro desde el inicio.
export const DEFAULT_FILTERS = {
    airlineCode: "",  // Vacío = Todas las aerolíneas
    airportCode: ""   // Vacío = Todos los aeropuertos
};

// 4. DATOS DE RELLENO (POR SI ACASO)
// A veces la API falla y no me manda datos de un avión.
// Para que la web no explote ni se quede la pantalla en blanco,
// uso este objeto. Si falta el fabricante, pondrá "Unknown" en vez de dar error.
export const DEFAULT_AIRCRAFT_DATA = {
  ICAOTypeCode: "",
  Manufacturer: "Unknown",
  ModeS: "",
  OperatorFlagCode: "",
  RegisteredOwners: "Unknown",
  Registration: "",
  Type: "",
};