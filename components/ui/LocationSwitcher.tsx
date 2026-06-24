/**
 * LocationSwitcher — comparison strip showing all locations side-by-side
 * with temp delta, condition, and alert badge. Active location is highlighted.
 */
import type { Location } from "@/lib/constants";
import { getWmo } from "@/lib/constants";
import type { UnitSystem } from "@/lib/units";
import { displayTemp, cToF, kphToMph, windDir } from "@/lib/units";
import type { WeatherResponse } from "@/services/weather/types";
import type { NwsAlert } from "@/services/alerts/client";

interface LocData { weather: WeatherResponse; alerts: NwsAlert[] }

interface Props {
  locations: Location[];
  activeIdx: number;
  data: Record<string, LocData>;
  units: UnitSystem;
  onSelect: (i: number) => void;
}

export default function LocationSwitcher({ locations, activeIdx, data, units, onSelect }: Props) {
  // Find reference temp for delta (first loaded location)
  const refData = data[locations[0]?.id];
  const refTempF = refData ? cToF(refData.weather.current.temperature_2m) : null;

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {locations.map((loc, i) => {
        const d       = data[loc.id];
        const active  = i === activeIdx;
        const wmo     = d ? getWmo(d.weather.current.weather_code) : { icon: "…", label: "" };
        const tempF   = d ? cToF(d.weather.current.temperature_2m) : null;
        const delta   = (tempF !== null && refTempF !== null && i > 0) ? tempF - refTempF : null;
        const nalerts = d?.alerts.length ?? 0;
        const wind    = d ? kphToMph(d.weather.current.wind_speed_10m) : null;
        const wdir    = d ? windDir(d.weather.current.wind_direction_10m) : "";
        const rh      = d?.weather.current.relative_humidity_2m;

        return (
          <button
            key={loc.id}
            onClick={() => onSelect(i)}
            className={`
              relative flex flex-col gap-0 rounded-lg border transition-all text-left overflow-hidden
              ${active
                ? "border-horizon bg-slate shadow-lg shadow-horizon/10"
                : "border-steel bg-navy hover:border-horizon/60 hover:bg-slate/40"}
            `}
            style={{ minWidth: 160 }}
          >
            {/* Active indicator bar */}
            {active && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-horizon" />
            )}

            <div className="px-3.5 pt-3 pb-2.5">
              {/* Location name */}
              <div className={`text-xs font-medium truncate ${active ? "text-paper" : "text-fog"}`}>
                {loc.label}
              </div>

              {/* Temp + icon row */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl leading-none">{wmo.icon}</span>
                <div>
                  <div className={`mono font-bold leading-none ${active ? "text-paper" : "text-fog"}`}
                    style={{ fontSize: 22 }}>
                    {tempF !== null
                      ? (units === "imperial" ? `${tempF.toFixed(0)}°F` : `${d!.weather.current.temperature_2m.toFixed(0)}°C`)
                      : "…"}
                  </div>
                  {/* Delta badge */}
                  {delta !== null && (
                    <div className="mono text-[9px] mt-0.5"
                      style={{ color: delta > 0 ? "#f0a500" : delta < 0 ? "#3d7ab5" : "#b8c8d8" }}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(0)}°F vs {locations[0].label.split(",")[0]}
                    </div>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div className="text-lime text-[10px] mt-1 truncate">{wmo.label}</div>

              {/* Wind + RH mini row */}
              {d && (
                <div className="flex gap-2 mt-1.5">
                  {wind !== null && (
                    <span className="mono text-[9px] text-fog">
                      💨 {wind.toFixed(0)} {wdir}
                    </span>
                  )}
                  {rh !== undefined && (
                    <span className="mono text-[9px] text-fog">
                      💧 {rh}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Alert bar at bottom */}
            {nalerts > 0 && (
              <div className="bg-amber/20 border-t border-amber/40 px-3.5 py-1">
                <span className="mono text-[9px] text-amber font-bold tracking-wide">
                  ▲ {nalerts} ALERT{nalerts > 1 ? "S" : ""}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
