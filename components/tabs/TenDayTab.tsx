"use client";
import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/services/weather/types";
import type { ClimateNormal } from "@/services/weather/types";
import type { Location } from "@/lib/constants";
import type { UnitSystem } from "@/lib/units";
import { cToF, mmToIn } from "@/lib/units";
import { getWmo } from "@/lib/constants";
import { fetchClimatologyNormals, getNormalsForDates } from "@/services/climate/client";
import NormalsRibbon from "@/components/ui/NormalsRibbon";
import SectionLabel from "@/components/ui/SectionLabel";

interface Props { wx: WeatherResponse; units: UnitSystem; loc: Location }

export default function TenDayTab({ wx, units, loc }: Props) {
  const d = wx.daily;
  const totalMm = d.precipitation_sum.reduce((a, b) => a + b, 0);
  const [normals,        setNormals]        = useState<ClimateNormal[]>([]);
  const [normalsLoading, setNormalsLoading] = useState(true);
  const [normalsError,   setNormalsError]   = useState(false);

  useEffect(() => {
    setNormalsLoading(true);
    setNormalsError(false);
    fetchClimatologyNormals(loc.lat, loc.lon)
      .then(setNormals)
      .catch(() => setNormalsError(true))
      .finally(() => setNormalsLoading(false));
  }, [loc]);

  const dateNormals = normals.length > 0 ? getNormalsForDates(normals, d.time) : [];

  return (
    <div>
      {/* Normals ribbon */}
      <div className="bg-slate rounded-lg px-4 py-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>10-Day vs 30-Year Climatological Normal</SectionLabel>
          {normalsLoading && <span className="mono text-[9px] text-steel tracking-widest">LOADING ARCHIVE…</span>}
          {normalsError   && <span className="mono text-[9px] text-amber tracking-widest">ARCHIVE UNAVAILABLE</span>}
        </div>
        {!normalsLoading && !normalsError && normals.length > 0 ? (
          <NormalsRibbon
            forecastDates={d.time}
            forecastHigh={d.temperature_2m_max}
            forecastLow={d.temperature_2m_min}
            normals={dateNormals}
            width={780}
          />
        ) : !normalsLoading && (
          <div className="text-fog text-xs py-4 text-center">No climatology data available</div>
        )}
      </div>

      <SectionLabel>10-Day Forecast Table</SectionLabel>
      <div className="bg-slate rounded-lg overflow-hidden mb-3">
        <div className="grid gap-2 px-3 py-2 border-b border-steel text-horizon mono text-[9px] tracking-widest"
          style={{ gridTemplateColumns: "90px 28px 1fr 56px 56px 52px 52px" }}>
          {["Day","","Conditions","High","Low","Precip","vs Nml"].map(h => <span key={h}>{h}</span>)}
        </div>
        {d.time.map((t, i) => {
          const wmo    = getWmo(d.weather_code[i]);
          const highF  = cToF(d.temperature_2m_max[i]);
          const lowF   = cToF(d.temperature_2m_min[i]);
          const precip = mmToIn(d.precipitation_sum[i]);
          const nm     = dateNormals[i];
          const devHigh = nm ? highF - cToF(nm.tmax_p50) : null;
          const date   = new Date(t);
          const label  = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
          return (
            <div key={t}
              className={`grid gap-2 px-3 py-2 items-center border-l-2 ${i === 0 ? "bg-steel/40 border-horizon" : "border-transparent hover:bg-steel/20"}`}
              style={{ gridTemplateColumns: "90px 28px 1fr 56px 56px 52px 52px" }}>
              <span className={`text-sm ${i === 0 ? "text-paper font-medium" : "text-fog"}`}>{label}</span>
              <span className="text-lg leading-none">{wmo.icon}</span>
              <span className="text-lime text-xs">{wmo.label}</span>
              <span className="mono text-amber text-sm text-right">{highF.toFixed(0)}°</span>
              <span className="mono text-horizon text-sm text-right">{lowF.toFixed(0)}°</span>
              <span className={`mono text-xs text-right ${precip > 0.1 ? "text-lime" : "text-steel"}`}>{precip.toFixed(2)}"</span>
              <span className={`mono text-xs text-right ${devHigh === null ? "text-steel" : devHigh > 3 ? "text-amber" : devHigh < -3 ? "text-horizon" : "text-fog"}`}>
                {devHigh !== null ? `${devHigh > 0 ? "+" : ""}${devHigh.toFixed(0)}°` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-fog text-xs text-right mono">
        10-day total: {totalMm.toFixed(1)} mm / {mmToIn(totalMm).toFixed(2)}"
      </div>
    </div>
  );
}
