"use client";
/**
 * NowTab v2 — redesigned with visual hierarchy:
 *  - Hero: large temp + anomaly badge + condition
 *  - Primary instruments: WindRose (large) + PressureGauge side by side
 *  - Priority grid: Wet Bulb (large accent) > Humidity > UV > Cloud > Precip
 *  - Solar window with daylight progress bar
 */
import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/services/weather/types";
import type { ClimateNormal } from "@/services/weather/types";
import type { NwsAlert } from "@/services/alerts/client";
import type { Location } from "@/lib/constants";
import { LOCATIONS } from "@/lib/constants";
import type { UnitSystem } from "@/lib/units";
import { cToF, mmToIn, kphToMph, displayTemp } from "@/lib/units";
import { getWmo } from "@/lib/constants";
import { wetBulb } from "@/services/derived";
import { fetchClimatologyNormals, getNormalsForDates } from "@/services/climate/client";
import PressureGauge  from "@/components/ui/PressureGauge";
import WindRose       from "@/components/ui/WindRose";
import AnomalyBadge   from "@/components/ui/AnomalyBadge";
import SectionLabel   from "@/components/ui/SectionLabel";

interface Props {
  wx: WeatherResponse;
  alerts: NwsAlert[];
  units: UnitSystem;
  loc: Location;
}

// Daylight progress bar
function SolarBar({ sunrise, sunset }: { sunrise: string; sunset: string }) {
  const now       = Date.now();
  const riseMs    = new Date(sunrise).getTime();
  const setMs     = new Date(sunset).getTime();
  const totalMs   = setMs - riseMs;
  const elapsed   = Math.max(0, Math.min(1, (now - riseMs) / totalMs));
  const isDaytime = now >= riseMs && now <= setMs;
  const daylightH = Math.floor(totalMs / 3_600_000);
  const daylightM = Math.round((totalMs % 3_600_000) / 60_000);

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <div>
          <div className="mono text-[9px] text-amber tracking-widest">☀ SUNRISE</div>
          <div className="mono text-paper text-sm">{new Date(sunrise).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div className="text-center">
          <div className="mono text-[9px] text-fog tracking-widest">DAYLIGHT</div>
          <div className="mono text-paper text-sm">{daylightH}h {daylightM}m</div>
        </div>
        <div className="text-right">
          <div className="mono text-[9px] text-horizon tracking-widest">SUNSET ●</div>
          <div className="mono text-paper text-sm">{new Date(sunset).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </div>
      {/* Progress bar */}
      <div className="relative h-2 bg-steel rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${elapsed * 100}%`,
            background: isDaytime
              ? "linear-gradient(90deg, #f0a500 0%, #ffe066 100%)"
              : "linear-gradient(90deg, #1c2f4a 0%, #3d7ab5 100%)",
          }}
        />
        {isDaytime && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber border-2 border-navy shadow-lg"
            style={{ left: `calc(${elapsed * 100}% - 6px)` }}
          />
        )}
      </div>
      {!isDaytime && (
        <div className="mono text-[9px] text-steel text-center mt-1 tracking-widest">
          {now < riseMs ? "BEFORE SUNRISE" : "AFTER SUNSET"}
        </div>
      )}
    </div>
  );
}

// Large metric tile for high-priority values
function BigTile({
  label, value, unit, sub, accent = "#2d4a6b", warning,
}: {
  label: string; value: string | number; unit?: string; sub?: string; accent?: string; warning?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3.5 flex flex-col justify-between"
      style={{
        background: warning ? `${accent}18` : "#1c2f4a",
        borderTop: `2px solid ${accent}`,
        border: warning ? `1px solid ${accent}60` : undefined,
      }}
    >
      <div className="mono text-[9px] tracking-widest uppercase" style={{ color: accent }}>{label}</div>
      <div className="mono font-bold mt-2 leading-none" style={{ fontSize: 32, color: warning ? accent : "#e8f0f8" }}>
        {value}
        {unit && <span className="text-sm ml-1" style={{ color: "#b8c8d8" }}>{unit}</span>}
      </div>
      {sub && <div className="mono text-[10px] mt-1" style={{ color: accent }}>{sub}</div>}
    </div>
  );
}

// Small supporting metric tile
function SmallTile({ label, value, unit, sub }: { label: string; value: string | number; unit?: string; sub?: string }) {
  return (
    <div className="bg-slate rounded-lg px-3 py-2.5">
      <div className="mono text-[9px] text-steel tracking-widest uppercase">{label}</div>
      <div className="mono text-paper text-lg font-bold mt-0.5 leading-none">
        {value}
        {unit && <span className="text-xs text-fog ml-1">{unit}</span>}
      </div>
      {sub && <div className="mono text-[10px] text-horizon mt-0.5">{sub}</div>}
    </div>
  );
}

export default function NowTab({ wx, alerts, units, loc }: Props) {
  const c   = wx.current;
  const wmo = getWmo(c.weather_code);
  const wb  = wetBulb(c.temperature_2m, c.relative_humidity_2m);
  const d   = wx.daily;
  const windMph = kphToMph(c.wind_speed_10m);

  // Wet bulb heat stress
  const wbF    = cToF(wb);
  const wbWarn = wbF > 82;

  // Climatology for anomaly badge
  const [normals,  setNormals]  = useState<ClimateNormal[]>([]);
  const [normLoad, setNormLoad] = useState(true);

  useEffect(() => {
    fetchClimatologyNormals(loc.lat, loc.lon)
      .then(setNormals)
      .catch(() => {})
      .finally(() => setNormLoad(false));
  }, [loc]);

  const todayNormals = normals.length > 0 && d
    ? getNormalsForDates(normals, [d.time[0]])[0]
    : null;

  return (
    <div className="space-y-3">

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="bg-amber/10 border border-amber/60 rounded-lg px-4 py-2.5 flex items-center gap-3">
          <span className="text-amber text-lg">▲</span>
          <div>
            <div className="mono text-amber text-xs font-bold tracking-wide">
              {alerts.length} ACTIVE NWS ALERT{alerts.length > 1 ? "S" : ""}
            </div>
            <div className="text-fog text-xs mt-0.5">{alerts[0]?.headline}</div>
          </div>
        </div>
      )}

      {/* Hero card */}
      <div className="bg-slate rounded-xl px-5 py-5 border-t-2 border-horizon"
        style={{ boxShadow: "0 4px 24px rgba(61,122,181,0.08)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          {/* Left: temp block */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span style={{ fontSize: 52 }} className="leading-none">{wmo.icon}</span>
              <div>
                <div className="mono font-bold leading-none text-paper" style={{ fontSize: 60 }}>
                  {displayTemp(c.temperature_2m, units)}
                </div>
                <div className="text-fog text-sm mt-0.5">
                  Feels like <span className="text-paper font-medium">{displayTemp(c.apparent_temperature, units)}</span>
                </div>
              </div>
            </div>
            <div className="text-lime text-base font-medium mb-2">{wmo.label}</div>
            {/* Anomaly badge */}
            <AnomalyBadge currentTempC={c.temperature_2m} normal={todayNormals} loading={normLoad} />
          </div>

          {/* Right: instruments */}
          <div className="flex items-center gap-4">
            <WindRose speedMph={windMph} dirDeg={c.wind_direction_10m} size={120} />
            <div className="flex flex-col items-center">
              <PressureGauge value={c.pressure_msl} />
              <div className="mono text-[9px] tracking-widest mt-1"
                style={{ color: c.pressure_msl < 1000 ? "#f0a500" : c.pressure_msl > 1020 ? "#7ec8a0" : "#b8c8d8" }}>
                {c.pressure_msl < 1000 ? "↓ LOW" : c.pressure_msl > 1020 ? "↑ HIGH" : "● STEADY"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority instruments row */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <BigTile
          label="Wet Bulb Temperature"
          value={units === "imperial" ? wbF.toFixed(1) : wb.toFixed(1)}
          unit={units === "imperial" ? "°F" : "°C"}
          sub={wbWarn ? "⚠ HEAT STRESS RISK" : "Within safe range"}
          accent={wbWarn ? "#f0a500" : "#7ec8a0"}
          warning={wbWarn}
        />
        <BigTile
          label="Relative Humidity"
          value={c.relative_humidity_2m}
          unit="%"
          sub={c.relative_humidity_2m > 80 ? "HIGH — oppressive" : c.relative_humidity_2m < 30 ? "LOW — dry air" : "Comfortable range"}
          accent={c.relative_humidity_2m > 80 ? "#f0a500" : "#7ec8a0"}
        />
        <BigTile
          label="UV Index"
          value={(c.uv_index ?? 0).toFixed(1)}
          sub={c.uv_index > 7 ? "⚠ HIGH — protect skin" : c.uv_index > 3 ? "Moderate exposure" : "Low risk"}
          accent={c.uv_index > 7 ? "#ff6b35" : c.uv_index > 3 ? "#f0a500" : "#7ec8a0"}
          warning={c.uv_index > 7}
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-3 gap-2.5">
        <SmallTile label="Cloud Cover" value={c.cloud_cover} unit="%" sub={c.cloud_cover > 75 ? "Overcast" : c.cloud_cover > 30 ? "Partly cloudy" : "Mostly clear"} />
        <SmallTile label="Precip Now"  value={mmToIn(c.precipitation).toFixed(2)} unit="in" sub={c.precipitation > 0 ? "Active precip" : "None"} />
        <SmallTile label="Pressure"    value={c.pressure_msl?.toFixed(0) ?? "—"} unit="hPa" sub={c.pressure_msl < 1000 ? "↓ Low" : c.pressure_msl > 1020 ? "↑ High" : "Steady"} />
      </div>

      {/* Solar window */}
      {d && (
        <div className="bg-slate rounded-lg px-4 py-3.5">
          <SectionLabel>Solar Window · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</SectionLabel>
          <SolarBar sunrise={d.sunrise[0]} sunset={d.sunset[0]} />
        </div>
      )}

      {/* Today's forecast range */}
      {d && (
        <div className="bg-slate rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="mono text-[9px] text-fog tracking-widest">TODAY HIGH</div>
              <div className="mono text-amber text-xl font-bold">{displayTemp(d.temperature_2m_max[0], units)}</div>
              {todayNormals && (
                <div className="mono text-[9px] text-fog mt-0.5">
                  Normal: {(units === "imperial" ? cToF(todayNormals.tmax_p50).toFixed(0) : todayNormals.tmax_p50.toFixed(0))}°
                </div>
              )}
            </div>
            <div className="w-px h-10 bg-steel" />
            <div>
              <div className="mono text-[9px] text-fog tracking-widest">TODAY LOW</div>
              <div className="mono text-horizon text-xl font-bold">{displayTemp(d.temperature_2m_min[0], units)}</div>
              {todayNormals && (
                <div className="mono text-[9px] text-fog mt-0.5">
                  Normal: {(units === "imperial" ? cToF(todayNormals.tmin_p50).toFixed(0) : todayNormals.tmin_p50.toFixed(0))}°
                </div>
              )}
            </div>
            <div className="w-px h-10 bg-steel" />
            <div>
              <div className="mono text-[9px] text-fog tracking-widest">PRECIP CHANCE</div>
              <div className="mono text-lime text-xl font-bold">{d.precipitation_probability_max[0]}%</div>
              <div className="mono text-[9px] text-fog mt-0.5">{mmToIn(d.precipitation_sum[0]).toFixed(2)}" expected</div>
            </div>
          </div>
          <div className="text-4xl">{getWmo(d.weather_code[0]).icon}</div>
        </div>
      )}
    </div>
  );
}
