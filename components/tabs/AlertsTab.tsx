import type { NwsAlert } from "@/services/alerts/client";
import { SEVERITY_COLORS } from "@/services/alerts/client";
import type { UnitSystem } from "@/lib/units";
import { displayTemp } from "@/lib/units";
import type { WeatherResponse } from "@/services/weather/types";
import { getWmo, LOCATIONS } from "@/lib/constants";
import SectionLabel from "@/components/ui/SectionLabel";

interface LocData { weather: WeatherResponse; alerts: NwsAlert[] }
interface Props { alerts: NwsAlert[]; allData: Record<string, LocData>; units: UnitSystem }

export default function AlertsTab({ alerts, allData, units }: Props) {
  return (
    <div>
      <SectionLabel>NWS Active Alerts</SectionLabel>
      {alerts.length === 0 ? (
        <div className="bg-slate rounded-lg px-4 py-8 text-center mb-5">
          <div className="mono text-lime text-sm tracking-wide">\u2713 NO ACTIVE ALERTS</div>
          <div className="text-fog text-xs mt-2">No watches, warnings, or advisories in effect</div>
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {alerts.map((a) => (
            <div key={a.id} className="rounded-r-md px-3 py-2.5 bg-navy"
              style={{ borderLeft: `3px solid ${SEVERITY_COLORS[a.severity] ?? "#b8c8d8"}` }}>
              <div className="mono text-[10px] tracking-widest" style={{ color: SEVERITY_COLORS[a.severity] ?? "#b8c8d8" }}>
                \u25b2 {a.event?.toUpperCase()} · {a.severity?.toUpperCase()}
              </div>
              <div className="text-fog text-xs mt-1">{a.headline}</div>
              {a.ends && <div className="mono text-[9px] text-steel mt-1">EXPIRES: {new Date(a.ends).toLocaleString()}</div>}
            </div>
          ))}
        </div>
      )}
      <SectionLabel>All Locations · Current Conditions</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LOCATIONS.map((loc) => {
          const d = allData[loc.id];
          if (!d) return null;
          const c = d.weather.current;
          const wmo = getWmo(c.weather_code);
          const nalert = d.alerts.length;
          return (
            <div key={loc.id} className="bg-slate rounded-lg px-4 py-3 border-t-2 border-steel">
              <div className="mono text-horizon text-[10px] tracking-widest">{loc.label.toUpperCase()}</div>
              <div className="flex justify-between items-start mt-2">
                <div>
                  <div className="mono text-paper text-2xl font-bold">{displayTemp(c.temperature_2m, units)}</div>
                  <div className="text-lime text-xs mt-0.5">{wmo.icon} {wmo.label}</div>
                </div>
                <div className="text-right">
                  <div className="text-fog text-xs">RH {c.relative_humidity_2m}%</div>
                  <div className="text-fog text-xs">{(c.wind_speed_10m * 0.621371).toFixed(0)} mph</div>
                  {nalert > 0 && <div className="mono text-amber text-xs mt-1">\u25b2 {nalert} ALERT{nalert > 1 ? "S" : ""}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
