import type { WeatherResponse } from "./types";

const BASE = "https://api.open-meteo.com/v1/forecast";

const CURRENT_VARS = [
  "temperature_2m", "relative_humidity_2m", "apparent_temperature",
  "precipitation", "weather_code", "wind_speed_10m", "wind_direction_10m",
  "pressure_msl", "cloud_cover", "uv_index",
].join(",");

const HOURLY_VARS = [
  "temperature_2m", "relative_humidity_2m", "precipitation_probability",
  "precipitation", "weather_code", "wind_speed_10m", "uv_index",
  "shortwave_radiation",        // for ET₀ Hargreaves-Samani
  "et0_fao_evapotranspiration", // Open-Meteo native ET₀ (bonus)
].join(",");

const DAILY_VARS = [
  "weather_code", "temperature_2m_max", "temperature_2m_min",
  "precipitation_sum", "precipitation_probability_max",
  "wind_speed_10m_max", "sunrise", "sunset",
  "et0_fao_evapotranspiration",   // daily ET₀
  "shortwave_radiation_sum",       // MJ/m² — used in Hargreaves-Samani
].join(",");

export async function fetchWeather(
  lat: number,
  lon: number,
  model = "best_match"
): Promise<WeatherResponse> {
  const url = new URL(BASE);
  url.searchParams.set("latitude",       String(lat));
  url.searchParams.set("longitude",      String(lon));
  url.searchParams.set("current",        CURRENT_VARS);
  url.searchParams.set("hourly",         HOURLY_VARS);
  url.searchParams.set("daily",          DAILY_VARS);
  url.searchParams.set("timezone",       "America/New_York");
  url.searchParams.set("forecast_days",  "10");
  url.searchParams.set("models",         model);

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<WeatherResponse>;
}

export async function fetchWeatherWithCache(
  locId: string, lat: number, lon: number, model = "best_match"
): Promise<WeatherResponse> {
  try {
    const res = await fetch(`/data/${locId}.json`);
    if (res.ok) {
      const cached = (await res.json()) as { ts: number; data: WeatherResponse; model: string };
      const ageMin = (Date.now() - cached.ts) / 60_000;
      if (ageMin < 20 && cached.model === model) return cached.data;
    }
  } catch { /* cache miss */ }
  return fetchWeather(lat, lon, model);
}
