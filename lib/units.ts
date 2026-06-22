export type UnitSystem = "imperial" | "metric";

export const cToF  = (c: number) => (c * 9) / 5 + 32;
export const mmToIn = (mm: number) => mm / 25.4;
export const mpsToMph = (mps: number) => mps * 2.23694;
export const kphToMph = (kph: number) => kph * 0.621371;

export function displayTemp(c: number, system: UnitSystem): string {
  return system === "imperial"
    ? `${cToF(c).toFixed(0)}°F`
    : `${c.toFixed(0)}°C`;
}

export function displaySpeed(kph: number, system: UnitSystem): string {
  return system === "imperial"
    ? `${kphToMph(kph).toFixed(0)} mph`
    : `${kph.toFixed(0)} km/h`;
}

export function displayPrecip(mm: number, system: UnitSystem): string {
  return system === "imperial"
    ? `${mmToIn(mm).toFixed(2)}"`
    : `${mm.toFixed(1)} mm`;
}

export const WIND_DIRS = ["N","NE","E","SE","S","SW","W","NW"] as const;
export function windDir(deg: number): string {
  return WIND_DIRS[Math.round(deg / 45) % 8];
}
