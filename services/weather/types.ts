export interface CurrentWeather {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  pressure_msl: number;
  cloud_cover: number;
  uv_index: number;
}

export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  uv_index: number[];
  shortwave_radiation: number[];
  et0_fao_evapotranspiration: number[];
}

export interface DailyWeather {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
  sunrise: string[];
  sunset: string[];
  et0_fao_evapotranspiration: number[];
  shortwave_radiation_sum: number[];
}

export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  hourly: HourlyWeather;
  daily: DailyWeather;
}

// ── Climatological normals (30-year archive) ──────────────────────────────
export interface ClimateNormal {
  doy: number;          // day of year 1-365
  tmax_p10: number;     // 10th percentile high (°C)
  tmax_p50: number;     // median high
  tmax_p90: number;     // 90th percentile high
  tmin_p10: number;
  tmin_p50: number;
  tmin_p90: number;
  precip_p50: number;   // median daily precip mm
  precip_p90: number;
}
