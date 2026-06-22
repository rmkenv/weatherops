import { cToF, mmToIn } from "@/lib/units";

// ── Wet bulb (Stull 2011) ─────────────────────────────────────────────────
export function wetBulb(tempC: number, rhPct: number): number {
  return (
    tempC * Math.atan(0.151977 * Math.sqrt(rhPct + 8.313659)) +
    Math.atan(tempC + rhPct) -
    Math.atan(rhPct - 1.676331) +
    0.00391838 * Math.pow(rhPct, 1.5) * Math.atan(0.023101 * rhPct) -
    4.686035
  );
}

// ── Degree days (simple average) ──────────────────────────────────────────
export function hdd(avgTempC: number, baseC = 18.3): number { return Math.max(0, baseC - avgTempC); }
export function cdd(avgTempC: number, baseC = 18.3): number { return Math.max(0, avgTempC - baseC); }

/** Simple average GDD */
export function gddSimple(tmaxC: number, tminC: number, baseC = 10): number {
  return Math.max(0, (tmaxC + tminC) / 2 - baseC);
}

// ── Baskerville-Emin (BE) sine curve GDD ─────────────────────────────────
/**
 * Baskerville-Emin method for Growing Degree Days.
 * Handles cases where tmin < base or tmax < base correctly using a
 * sine-wave approximation of the diurnal temperature cycle.
 * baseC: base temp in °C (default 10 = 50°F for corn/soy)
 * upperCutoffC: optional upper cutoff (default null = no cutoff)
 */
export function gddBE(tmaxC: number, tminC: number, baseC = 10, upperCutoffC?: number): number {
  // Clamp: if tmax < base, no heat accumulation
  if (tmaxC <= baseC) return 0;

  // Apply upper cutoff if specified
  const tmax = upperCutoffC !== undefined ? Math.min(tmaxC, upperCutoffC) : tmaxC;
  const tmin = tminC;
  const mean = (tmax + tmin) / 2;
  const amplitude = (tmax - tmin) / 2;

  if (amplitude === 0) return Math.max(0, mean - baseC);

  if (tmin >= baseC) {
    // Entire day above base — simple average
    return mean - baseC;
  }

  // Partial day above base — sine integration
  const theta = Math.acos((baseC - mean) / amplitude);
  return (
    (1 / Math.PI) *
    (
      (mean - baseC) * theta +
      amplitude * Math.sin(theta)
    )
  );
}

/** GDD for common crops using BE method */
export interface CropGDD {
  crop: string;
  baseF: number;
  upperF: number | null;
  gdd: number;
}

export function cropGDDs(tmaxC: number, tminC: number): CropGDD[] {
  const crops = [
    { crop: "Corn",         baseF: 50, upperF: 86  },
    { crop: "Soybean",      baseF: 50, upperF: 86  },
    { crop: "Winter Wheat", baseF: 32, upperF: null },
    { crop: "Cotton",       baseF: 60, upperF: 100 },
    { crop: "Apple (McIntosh)", baseF: 43, upperF: null }, // tree fruit
  ];
  return crops.map(({ crop, baseF, upperF }) => {
    const baseC  = (baseF  - 32) * 5 / 9;
    const upperC = upperF !== null ? (upperF - 32) * 5 / 9 : undefined;
    return { crop, baseF, upperF, gdd: gddBE(tmaxC, tminC, baseC, upperC) };
  });
}

// ── ET₀ Hargreaves-Samani ─────────────────────────────────────────────────
/**
 * Reference evapotranspiration via Hargreaves-Samani (1985).
 * raMJm2: extraterrestrial radiation in MJ/m²/day
 * Returns ET₀ in mm/day.
 */
export function etHargreaves(tmaxC: number, tminC: number, raMJm2: number): number {
  const tmean = (tmaxC + tminC) / 2;
  return 0.0023 * raMJm2 * Math.sqrt(Math.max(0, tmaxC - tminC)) * (tmean + 17.8);
}

/**
 * Approximate extraterrestrial radiation (Ra) in MJ/m²/day
 * from latitude (decimal degrees) and day of year.
 * Based on FAO-56 equations 21-28.
 */
export function extraterrestrialRadiation(latDeg: number, doy: number): number {
  const phi    = (latDeg * Math.PI) / 180;
  const dr     = 1 + 0.033 * Math.cos((2 * Math.PI / 365) * doy);
  const delta  = 0.409 * Math.sin((2 * Math.PI / 365) * doy - 1.39);
  const ws     = Math.acos(-Math.tan(phi) * Math.tan(delta));
  const Gsc    = 0.0820; // solar constant MJ/m²/min
  return (24 * 60 / Math.PI) * Gsc * dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
}

// ── Field ops ─────────────────────────────────────────────────────────────
export function fieldOpsScore(precipProb: number[], windowHours = 48, threshold = 20): number {
  const slice = precipProb.slice(0, windowHours);
  return (slice.filter((p) => p < threshold).length / slice.length) * 100;
}

export function hayDryingHours(precipProb: number[], windKph: number[], rhPct: number[], windowHours = 48): number {
  let count = 0;
  for (let i = 0; i < Math.min(windowHours, precipProb.length); i++) {
    if (precipProb[i] < 20 && windKph[i] > 8 && rhPct[i] < 65) count++;
  }
  return count;
}

// ── Daily derived builder ─────────────────────────────────────────────────
export interface DailyDerived {
  date: string;
  gddSimple: number;
  gddBE: number;
  cropGDDs: CropGDD[];
  hdd: number;
  cdd: number;
  precipIn: number;
  highF: number;
  lowF: number;
  et0mm: number;      // Open-Meteo native ET₀ (mm)
  et0HS: number;      // Hargreaves-Samani ET₀ (mm)
}

export function buildDailyDerived(
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    et0_fao_evapotranspiration: number[];
    shortwave_radiation_sum: number[];
  },
  lat: number
): DailyDerived[] {
  return daily.time.map((date, i) => {
    const tmax    = daily.temperature_2m_max[i];
    const tmin    = daily.temperature_2m_min[i];
    const avg     = (tmax + tmin) / 2;
    const d       = new Date(date);
    const start   = new Date(d.getFullYear(), 0, 0);
    const doy     = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
    const ra      = extraterrestrialRadiation(lat, doy);
    const et0HS   = etHargreaves(tmax, tmin, ra);
    return {
      date,
      gddSimple: gddSimple(tmax, tmin),
      gddBE:     gddBE(tmax, tmin),
      cropGDDs:  cropGDDs(tmax, tmin),
      hdd:       hdd(avg),
      cdd:       cdd(avg),
      precipIn:  mmToIn(daily.precipitation_sum[i]),
      highF:     cToF(tmax),
      lowF:      cToF(tmin),
      et0mm:     daily.et0_fao_evapotranspiration[i] ?? 0,
      et0HS,
    };
  });
}
