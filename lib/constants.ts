export interface Location {
  id: string;
  label: string;
  lat: number;
  lon: number;
  nwsZone?: string;
}

// ── Locations — Bloomery/Paw Paw WV is default (index 0) ─────────────────
export const LOCATIONS: Location[] = [
  {
    id:       "bloomery",
    label:    "Bloomery, WV",
    lat:      39.315,
    lon:      -78.575,
    nwsZone:  "WVZ012",   // Hampshire County WV — NWS Charleston (RLX)
  },
  {
    id:       "catonsville",
    label:    "Catonsville, MD",
    lat:      39.2723,
    lon:      -76.7322,
    nwsZone:  "MDZ013",
  },
  {
    id:       "dc",
    label:    "Washington, DC",
    lat:      38.9072,
    lon:      -77.0369,
    nwsZone:  "DCZ001",
  },
];

export interface WmoEntry { label: string; icon: string }

export const WMO_CODES: Record<number, WmoEntry> = {
  0:  { label: "Clear",          icon: "☀️"  },
  1:  { label: "Mostly Clear",   icon: "🌤️" },
  2:  { label: "Partly Cloudy",  icon: "⛅"  },
  3:  { label: "Overcast",       icon: "☁️"  },
  45: { label: "Foggy",          icon: "🌫️" },
  48: { label: "Icy Fog",        icon: "🌫️" },
  51: { label: "Light Drizzle",  icon: "🌦️" },
  53: { label: "Drizzle",        icon: "🌦️" },
  55: { label: "Heavy Drizzle",  icon: "🌧️" },
  61: { label: "Light Rain",     icon: "🌧️" },
  63: { label: "Rain",           icon: "🌧️" },
  65: { label: "Heavy Rain",     icon: "🌧️" },
  71: { label: "Light Snow",     icon: "🌨️" },
  73: { label: "Snow",           icon: "❄️"  },
  75: { label: "Heavy Snow",     icon: "❄️"  },
  80: { label: "Rain Showers",   icon: "🌦️" },
  81: { label: "Showers",        icon: "🌦️" },
  82: { label: "Heavy Showers",  icon: "⛈️" },
  95: { label: "Thunderstorm",   icon: "⛈️" },
  96: { label: "Hail Storm",     icon: "⛈️" },
  99: { label: "Heavy Hail",     icon: "⛈️" },
};

export function getWmo(code: number): WmoEntry {
  return WMO_CODES[code] ?? { label: "Unknown", icon: "🌡️" };
}

// ── Forecast model selector ────────────────────────────────────────────────
export interface ForecastModel {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  origin: string;
  resolution: string;
}

export const FORECAST_MODELS: ForecastModel[] = [
  { id: "best_match",    label: "Best Match (Auto)", shortLabel: "AUTO",  description: "Open-Meteo selects highest-resolution model for the location.", origin: "Open-Meteo", resolution: "Variable" },
  { id: "gfs_seamless",  label: "GFS (NOAA)",        shortLabel: "GFS",   description: "NOAA Global Forecast System, updated 4x/day.",                   origin: "NOAA/NCEP",  resolution: "13 km"   },
  { id: "ecmwf_ifs025",  label: "ECMWF IFS",         shortLabel: "ECMWF", description: "European Centre — best-in-class beyond 3 days.",                  origin: "ECMWF",      resolution: "25 km"   },
  { id: "icon_seamless", label: "ICON (DWD)",         shortLabel: "ICON",  description: "DWD Germany — strong over Europe and North Atlantic.",             origin: "DWD",        resolution: "13 km"   },
  { id: "nam_conus",     label: "NAM CONUS",          shortLabel: "NAM",   description: "North American Mesoscale — highest CONUS resolution.",             origin: "NOAA/NCEP",  resolution: "3 km"    },
  { id: "hrrr",          label: "HRRR",               shortLabel: "HRRR",  description: "High-Resolution Rapid Refresh — updated hourly, best 0-18h.",     origin: "NOAA/ESRL",  resolution: "3 km"    },
];

export const DEFAULT_MODEL = "best_match";

// ── Tabs ───────────────────────────────────────────────────────────────────
export const TABS = ["now", "hourly", "10-day", "derived", "map", "alerts"] as const;
export type Tab = (typeof TABS)[number];

// ── NEXRAD radar (Iowa Mesonet) ────────────────────────────────────────────
export const NEXRAD_BASE = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png";

// ── Climate archive ────────────────────────────────────────────────────────
export const CLIMATE_API_BASE = "https://archive-api.open-meteo.com/v1/archive";
