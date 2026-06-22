import type { Location } from "@/lib/constants";
import { getWmo } from "@/lib/constants";
import type { UnitSystem } from "@/lib/units";
import { displayTemp } from "@/lib/units";
import type { WeatherResponse } from "@/services/weather/types";
import type { NwsAlert } from "@/services/alerts/client";

interface LocData {
  weather: WeatherResponse;
  alerts: NwsAlert[];
}

interface Props {
  locations: Location[];
  activeIdx: number;
  data: Record<string, LocData>;
  units: UnitSystem;
  onSelect: (i: number) => void;
}

export default function LocationSwitcher({
  locations, activeIdx, data, units, onSelect,
}: Props) {
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {locations.map((loc, i) => {
        const d      = data[loc.id];
        const temp   = d ? displayTemp(d.weather.current.temperature_2m, units) : "…";
        const wmo    = d ? getWmo(d.weather.current.weather_code) : { icon: "…" };
        const nalerts = d?.alerts.length ?? 0;
        const active = i === activeIdx;

        return (
          <button
            key={loc.id}
            onClick={() => onSelect(i)}
            className={`
              flex items-center gap-2 px-3.5 py-2 rounded-md border text-sm transition-colors
              ${active
                ? "bg-steel border-horizon text-paper"
                : "bg-slate border-steel text-fog hover:border-horizon"}
            `}
          >
            <span className="text-lg leading-none">{wmo.icon}</span>
            <span className="font-medium">{loc.label}</span>
            <span className="mono text-sm font-bold">{temp}</span>
            {nalerts > 0 && (
              <span className="bg-amber text-navy rounded text-[9px] px-1.5 py-0.5 font-bold">
                {nalerts}▲
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
