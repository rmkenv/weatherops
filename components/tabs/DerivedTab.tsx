"use client";
import type { WeatherResponse } from "@/services/weather/types";
import type { Location } from "@/lib/constants";
import type { UnitSystem } from "@/lib/units";
import { cToF, mmToIn } from "@/lib/units";
import { buildDailyDerived, fieldOpsScore, hayDryingHours, wetBulb } from "@/services/derived";
import Tile from "@/components/ui/Tile";
import Sparkline from "@/components/ui/Sparkline";
import SectionLabel from "@/components/ui/SectionLabel";

interface Props { wx: WeatherResponse; units: UnitSystem; loc: Location }

export default function DerivedTab({ wx, units, loc }: Props) {
  const daily  = buildDailyDerived(wx.daily, loc.lat);
  const today  = daily[0];
  const fops   = fieldOpsScore(wx.hourly.precipitation_probability);
  const hayHrs = hayDryingHours(wx.hourly.precipitation_probability, wx.hourly.wind_speed_10m, wx.hourly.relative_humidity_2m);
  const maxPop = Math.max(...wx.hourly.precipitation_probability.slice(0, 48));
  const wbSeries = wx.hourly.temperature_2m.slice(0, 48).map((t, i) => cToF(wetBulb(t, wx.hourly.relative_humidity_2m[i])));
  const et0Series = wx.daily.et0_fao_evapotranspiration ?? [];

  return (
    <div>
      <SectionLabel>Agro-Climate Metrics · Today</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <Tile label="GDD-BE (base 50°F)" value={today.gddBE.toFixed(2)}     unit="°day" sub="Sine curve method" accent="#7ec8a0" />
        <Tile label="HDD (base 65°F)"    value={today.hdd.toFixed(1)}        unit="°day" sub="Heating load"      accent="#3d7ab5" />
        <Tile label="CDD (base 65°F)"    value={today.cdd.toFixed(1)}        unit="°day" sub="Cooling load"      accent="#f0a500" />
        <Tile label="ET₀ (FAO-56)"       value={today.et0mm.toFixed(2)}      unit="mm"   sub="Reference ET"      accent="#7ec8a0" />
      </div>

      {/* Multi-crop GDD table */}
      <SectionLabel>Multi-Crop GDD · Today (Baskerville-Emin Method)</SectionLabel>
      <div className="bg-slate rounded-lg px-4 py-3 mb-5">
        <div className="grid gap-2 mb-2 text-horizon mono text-[9px] tracking-widest"
          style={{ gridTemplateColumns: "1fr 60px 60px 80px" }}>
          {["Crop","Base °F","Upper °F","GDD (BE)"].map(h => <span key={h}>{h}</span>)}
        </div>
        {today.cropGDDs.map((c) => (
          <div key={c.crop}
            className="grid gap-2 py-1.5 border-b border-steel/60 last:border-0"
            style={{ gridTemplateColumns: "1fr 60px 60px 80px" }}>
            <span className="text-fog text-xs">{c.crop}</span>
            <span className="mono text-fog text-xs">{c.baseF}°F</span>
            <span className="mono text-fog text-xs">{c.upperF ?? "—"}</span>
            <span className="mono text-lime text-sm font-bold">{c.gdd.toFixed(2)}</span>
          </div>
        ))}
        <div className="mt-2 text-steel text-[10px]">
          Simple avg GDD for comparison: {today.gddSimple.toFixed(2)} °day
        </div>
      </div>

      {/* 10-day degree day table */}
      <SectionLabel>10-Day GDD / HDD / ET₀</SectionLabel>
      <div className="bg-slate rounded-lg px-4 py-3 mb-5">
        <div className="grid gap-2 mb-1 text-horizon mono text-[9px] tracking-widest"
          style={{ gridTemplateColumns: "90px 1fr 1fr 1fr 1fr" }}>
          {["Day","GDD-BE","HDD","ET₀ mm","Hi/Lo °F"].map(h => <span key={h}>{h}</span>)}
        </div>
        {daily.map((d, i) => {
          const date  = new Date(d.date);
          const label = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });
          return (
            <div key={d.date}
              className={`grid gap-2 py-1.5 ${i < daily.length - 1 ? "border-b border-steel/40" : ""}`}
              style={{ gridTemplateColumns: "90px 1fr 1fr 1fr 1fr" }}>
              <span className="text-fog text-xs">{label}</span>
              <span className="mono text-lime text-xs">{d.gddBE.toFixed(1)}</span>
              <span className="mono text-horizon text-xs">{d.hdd.toFixed(1)}</span>
              <span className="mono text-paper text-xs">{d.et0mm.toFixed(1)}</span>
              <span className="mono text-amber text-xs">{d.highF.toFixed(0)}° / {d.lowF.toFixed(0)}°</span>
            </div>
          );
        })}
      </div>

      {/* ET₀ sparkline */}
      {et0Series.length > 0 && (
        <>
          <SectionLabel>ET₀ Reference Evapotranspiration · 10-Day (mm/day)</SectionLabel>
          <div className="bg-slate rounded-lg px-4 py-3 mb-5">
            <Sparkline values={et0Series} color="#7ec8a0" width={600} />
            <div className="text-fog text-[10px] mt-1">
              Cumulative 10-day ET₀: {et0Series.reduce((a, b) => a + b, 0).toFixed(1)} mm
            </div>
          </div>
        </>
      )}

      {/* Wet bulb */}
      <SectionLabel>Wet Bulb Temperature Trend (48h)</SectionLabel>
      <div className="bg-slate rounded-lg px-4 py-3 mb-5">
        <Sparkline values={wbSeries} color="#f0a500" width={600} />
        <div className="flex justify-between mt-1">
          <span className="text-fog text-[10px]">Wet bulb °F — heat stress threshold: 85°F</span>
          <span className={`mono text-[10px] ${Math.max(...wbSeries) > 85 ? "text-amber" : "text-lime"}`}>
            Peak: {Math.max(...wbSeries).toFixed(1)}°F
          </span>
        </div>
      </div>

      {/* Field ops */}
      <SectionLabel>Field Operations Window · Next 48h</SectionLabel>
      <div className="bg-slate rounded-lg px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <div className="mono text-[10px] text-fog tracking-wide uppercase">Clear Hours</div>
            <div className="mono text-2xl font-bold mt-0.5" style={{ color: fops > 60 ? "#7ec8a0" : "#f0a500" }}>{fops.toFixed(0)}%</div>
            <div className="text-fog text-xs mt-0.5">below 20% PoP</div>
          </div>
          <div>
            <div className="mono text-[10px] text-fog tracking-wide uppercase">Peak PoP</div>
            <div className="mono text-2xl font-bold mt-0.5" style={{ color: maxPop > 60 ? "#f0a500" : "#7ec8a0" }}>{maxPop}%</div>
            <div className="text-fog text-xs mt-0.5">next 48h</div>
          </div>
          <div>
            <div className="mono text-[10px] text-fog tracking-wide uppercase">Hay-Drying Hrs</div>
            <div className="mono text-2xl font-bold mt-0.5 text-lime">{hayHrs}</div>
            <div className="text-fog text-xs mt-0.5">{"<"}20% PoP + wind + RH{"<"}65%</div>
          </div>
        </div>
        <div className={`mono text-xs mt-2 ${maxPop > 60 ? "text-amber" : "text-lime"}`}>
          {maxPop > 60 ? "⚠ Unfavorable conditions for field operations next 48h" : "✓ Generally favorable window for field operations next 48h"}
        </div>
      </div>
    </div>
  );
}
