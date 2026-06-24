const fs   = require("fs");
const path = require("path");

const LOCATIONS = [
  { id: "bloomery",   lat: 39.315,  lon: -78.575 },
  { id: "catonsville",lat: 39.2723, lon: -76.7322 },
  { id: "dc",         lat: 38.9072, lon: -77.0369 },
];

const CURRENT = "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,cloud_cover,uv_index";
const HOURLY  = "temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index,shortwave_radiation,et0_fao_evapotranspiration";
const DAILY   = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,et0_fao_evapotranspiration,shortwave_radiation_sum";

async function fetchWeather(lat, lon, model = "best_match") {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude",      lat);
  url.searchParams.set("longitude",     lon);
  url.searchParams.set("current",       CURRENT);
  url.searchParams.set("hourly",        HOURLY);
  url.searchParams.set("daily",         DAILY);
  url.searchParams.set("timezone",      "America/New_York");
  url.searchParams.set("forecast_days", "10");
  url.searchParams.set("models",        model);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

async function fetchAlerts(lat, lon) {
  const res = await fetch(
    `https://api.weather.gov/alerts/active?point=${lat},${lon}&limit=10`,
    { headers: { "User-Agent": "WeatherOps/1.0 (iqspatial.com)" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features ?? []).map((f) => ({
    id: f.id, event: f.properties.event, headline: f.properties.headline,
    severity: f.properties.severity, urgency: f.properties.urgency,
    ends: f.properties.ends, areaDesc: f.properties.areaDesc,
  }));
}

async function main() {
  const outDir = path.join(__dirname, "..", "public", "data");
  fs.mkdirSync(outDir, { recursive: true });
  for (const loc of LOCATIONS) {
    try {
      const [weather, alerts] = await Promise.all([fetchWeather(loc.lat, loc.lon), fetchAlerts(loc.lat, loc.lon)]);
      fs.writeFileSync(path.join(outDir, `${loc.id}.json`), JSON.stringify({ ts: Date.now(), weather, alerts }));
      console.log(`✓ ${loc.id}`);
    } catch (err) {
      console.error(`✗ ${loc.id}: ${err.message}`);
    }
  }
}

main();
