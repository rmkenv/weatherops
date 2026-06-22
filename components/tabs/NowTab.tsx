import type { WeatherResponse } from "@/services/weather/types";
import type { NwsAlert } from "@/services/alerts/client";
import type { UnitSystem } from "@/lib/units";
import { cToF, mmToIn, kphToMph, windDir, displayTemp } from "@/lib/units";
import { getWmo } from "@/lib/constants";
import { wetBulb } from "@/services/derived";
import PressureGauge from "@/components/ui/PressureGauge";
import Tile from "@/components/ui/Tile";
import SectionLabel from "@/components/ui/SectionLabel";

interface Props { wx: WeatherResponse; alerts: NwsAlert[]; units: UnitSystem }

export default function NowTab({ wx, alerts, units }: Props) {
  const c   = wx.current;
  const wmo = getWmo(c.weather_code);
  const wb  = wetBulb(c.temperature_2m, c.relative_humidity_2m);
  const d   = wx.daily;
  return (
    <div>
      {alerts.length > 0 && (
        <div className="mb-4 bg-amber/10 border border-amber rounded-md px-4 py-2 text-amber mono text-xs tracking-wide">
          ▲ {alerts.length} ACTIVE NWS ALERT{alerts.length > 1 ? "S" : ""} — SEE ALERTS TAB
        </div>
      )}
      <div className="bg-slate rounded-xl px-6 py-5 mb-4 flex items-center justify-between flex-wrap gap-4 border-t-2 border-horizon">
        <div className="flex items-center gap-5">
          <span className="text-6xl leading-none">{wmo.icon}</span>
          <div>
            <div className="mono text-paper font-bold leading-none" style={{ fontSize: 52 }}>
              {displayTemp(c.temperature_2m, units)}
            </div>
            <div className="text-lime text-base mt-1">{wmo.label}</div>
            <div className="text-fog text-sm mt-0.5">Feels like {displayTemp(c.apparent_temperature, units)}</div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <PressureGauge value={c.pressure_msl} />
          <div className="mono text-fog text-[9px] tracking-widest mt-1">
            {c.pressure_msl < 1000 ? "\u2193 LOW" : c.pressure_msl > 1020 ? "\u2191 HIGH" : "STEADY"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
        <Tile label="Humidity"    value={c.relative_humidity_2m}                                      unit="%" accent="#7ec8a0" />
        <Tile label="Wind"        value={kphToMph(c.wind_speed_10m).toFixed(0)}                      unit="mph" sub={windDir(c.wind_direction_10m)} accent="#3d7ab5" />
        <Tile label="Wet Bulb"    value={units === "imperial" ? cToF(wb).toFixed(1) : wb.toFixed(1)} unit={units === "imperial" ? "\u00b0F" : "\u00b0C"} accent="#f0a500" />
        <Tile label="UV Index"    value={c.uv_index ?? "\u2014"}                                    sub={c.uv_index > 7 ? "HIGH" : c.uv_index > 3 ? "MOD" : "LOW"} />
        <Tile label="Cloud Cover" value={c.cloud_cover}                                              unit="%" />
        <Tile label="Precip"      value={mmToIn(c.precipitation).toFixed(2)}                         unit="in" accent="#7ec8a0" />
      </div>
      {d && (
        <div className="bg-slate rounded-lg px-4 py-3">
          <SectionLabel>Solar Window</SectionLabel>
          <div className="flex gap-6 flex-wrap">
            {[
              { label: "\u2600 SUNRISE", color: "#f0a500", val: new Date(d.sunrise[0]).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
              { label: "\u25cf SUNSET",  color: "#3d7ab5", val: new Date(d.sunset[0]).toLocaleTimeString("en-US",  { hour: "2-digit", minute: "2-digit" }) },
              { label: "DAYLIGHT",        color: "#b8c8d8", val: (() => { const mins = (new Date(d.sunset[0]).getTime() - new Date(d.sunrise[0]).getTime()) / 60000; return `${Math.floor(mins / 60)}h ${(mins % 60).toFixed(0)}m`; })() },
            ].map(({ label, color, val }) => (
              <div key={label}>
                <div className="mono text-[10px] tracking-wide" style={{ color }}>{label}</div>
                <div className="mono text-paper text-base mt-0.5">{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
