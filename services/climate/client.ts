import type { ClimateNormal } from "@/services/weather/types";

const ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1/archive";
const NORM_YEARS   = 30;
const CACHE_KEY    = (lat: number, lon: number) => `climate_normal_${lat.toFixed(3)}_${lon.toFixed(3)}`;
const CACHE_TTL_H  = 72;

interface ArchiveDay { date: string; tmax: number; tmin: number; precip: number }

function pct(arr: number[], p: number): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx    = (p / 100) * (sorted.length - 1);
  const lo     = Math.floor(idx);
  const hi     = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function doyOf(dateStr: string): number {
  const date  = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

function buildNormals(days: ArchiveDay[]): ClimateNormal[] {
  const byDoy: Record<number, { tmax: number[]; tmin: number[]; precip: number[] }> = {};
  for (const d of days) {
    const doy = doyOf(d.date);
    if (!byDoy[doy]) byDoy[doy] = { tmax: [], tmin: [], precip: [] };
    if (!isNaN(d.tmax))   byDoy[doy].tmax.push(d.tmax);
    if (!isNaN(d.tmin))   byDoy[doy].tmin.push(d.tmin);
    if (!isNaN(d.precip)) byDoy[doy].precip.push(d.precip);
  }
  return Object.entries(byDoy).map(([doyStr, v]) => ({
    doy:        Number(doyStr),
    tmax_p10:   pct(v.tmax,   10),
    tmax_p50:   pct(v.tmax,   50),
    tmax_p90:   pct(v.tmax,   90),
    tmin_p10:   pct(v.tmin,   10),
    tmin_p50:   pct(v.tmin,   50),
    tmin_p90:   pct(v.tmin,   90),
    precip_p50: pct(v.precip, 50),
    precip_p90: pct(v.precip, 90),
  })).sort((a, b) => a.doy - b.doy);
}

export async function fetchClimatologyNormals(lat: number, lon: number): Promise<ClimateNormal[]> {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CACHE_KEY(lat, lon));
      if (raw) {
        const { ts, normals } = JSON.parse(raw) as { ts: number; normals: ClimateNormal[] };
        if ((Date.now() - ts) < CACHE_TTL_H * 3_600_000) return normals;
      }
    } catch { /* ignore */ }
  }

  const endYear   = new Date().getFullYear() - 1;
  const startYear = endYear - NORM_YEARS + 1;

  const url = new URL(ARCHIVE_BASE);
  url.searchParams.set("latitude",   String(lat));
  url.searchParams.set("longitude",  String(lon));
  url.searchParams.set("start_date", `${startYear}-01-01`);
  url.searchParams.set("end_date",   `${endYear}-12-31`);
  url.searchParams.set("daily",      "temperature_2m_max,temperature_2m_min,precipitation_sum");
  url.searchParams.set("timezone",   "America/New_York");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Climate archive error: ${res.status}`);
  const data = await res.json();

  const days: ArchiveDay[] = (data.daily.time as string[]).map((date: string, i: number) => ({
    date,
    tmax:   data.daily.temperature_2m_max[i],
    tmin:   data.daily.temperature_2m_min[i],
    precip: data.daily.precipitation_sum[i],
  }));

  const normals = buildNormals(days);

  if (typeof window !== "undefined") {
    try { localStorage.setItem(CACHE_KEY(lat, lon), JSON.stringify({ ts: Date.now(), normals })); }
    catch { /* storage full */ }
  }
  return normals;
}

export function getNormalsForDates(normals: ClimateNormal[], dates: string[]): (ClimateNormal | null)[] {
  return dates.map((d) => normals.find((n) => n.doy === doyOf(d)) ?? null);
}
