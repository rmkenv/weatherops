"use client";

import { useState, useCallback } from "react";
import { LOCATIONS, TABS, DEFAULT_MODEL, type Tab } from "@/lib/constants";
import type { Location } from "@/lib/constants";
import type { WeatherResponse } from "@/services/weather/types";
import type { NwsAlert } from "@/services/alerts/client";
import type { UnitSystem } from "@/lib/units";

import WaveBackground   from "./ui/WaveBackground";
import TabNav           from "./ui/TabNav";
import LocationSwitcher from "./ui/LocationSwitcher";
import ModelSelector    from "./ui/ModelSelector";
import NowTab           from "./tabs/NowTab";
import HourlyTab        from "./tabs/HourlyTab";
import TenDayTab        from "./tabs/TenDayTab";
import DerivedTab       from "./tabs/DerivedTab";
import MapTab           from "./tabs/MapTab";
import AlertsTab        from "./tabs/AlertsTab";

interface LocationData { loc: Location; weather: WeatherResponse; alerts: NwsAlert[] }
interface Props { initialData: LocationData[] }

export default function WeatherDashboard({ initialData }: Props) {
  const [activeLocIdx, setActiveLocIdx] = useState(0);
  const [activeTab,    setActiveTab]    = useState<Tab>("now");
  const [units,        setUnits]        = useState<UnitSystem>("imperial");
  const [model,        setModel]        = useState(DEFAULT_MODEL);
  const [data,         setData]         = useState<Record<string, LocationData>>(
    Object.fromEntries(initialData.map((d) => [d.loc.id, d]))
  );
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  const loc     = LOCATIONS[activeLocIdx];
  const locData = data[loc.id];
  const alerts  = locData?.alerts ?? [];

  const refresh = useCallback(async (locId: string, lat: number, lon: number, mdl: string) => {
    setRefreshing((p) => ({ ...p, [locId]: true }));
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}&model=${mdl}`);
      if (res.ok) {
        const json = await res.json();
        setData((p) => ({
          ...p,
          [locId]: { loc: LOCATIONS.find((l) => l.id === locId)!, weather: json.weather, alerts: json.alerts },
        }));
      }
    } finally {
      setRefreshing((p) => ({ ...p, [locId]: false }));
    }
  }, []);

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    LOCATIONS.forEach((l) => refresh(l.id, l.lat, l.lon, newModel));
  };

  return (
    <div className="min-h-screen bg-navy text-paper">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-slate">
        <WaveBackground />
        <div className="relative z-10 px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="mono text-horizon text-[10px] tracking-[3px]">IQSPATIAL · WEATHEROPS</p>
              <h1 className="text-xl font-semibold mt-0.5">Weather Intelligence Platform</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <ModelSelector value={model} onChange={handleModelChange} />
              <button
                onClick={() => setUnits((u) => u === "imperial" ? "metric" : "imperial")}
                className="mono text-[10px] tracking-widest bg-slate border border-steel text-fog rounded px-3 py-1 hover:border-horizon transition-colors"
              >
                °{units === "imperial" ? "F" : "C"}
              </button>
              <button
                onClick={() => refresh(loc.id, loc.lat, loc.lon, model)}
                disabled={refreshing[loc.id]}
                className="mono text-[10px] tracking-widest bg-slate border border-steel text-fog rounded px-3 py-1 hover:border-horizon transition-colors disabled:opacity-40"
              >
                {refreshing[loc.id] ? "…" : "↺ REFRESH"}
              </button>
              <span className="mono text-[9px] text-steel hidden sm:block">
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <LocationSwitcher
            locations={LOCATIONS}
            activeIdx={activeLocIdx}
            data={data}
            units={units}
            onSelect={setActiveLocIdx}
          />
        </div>
      </header>

      <TabNav tabs={TABS} active={activeTab} alertCount={alerts.length} onChange={setActiveTab} />

      <main className="max-w-4xl mx-auto px-5 py-5">
        {!locData ? (
          <div className="text-center py-16 mono text-horizon text-xs tracking-widest animate-pulse">
            ACQUIRING DATA…
          </div>
        ) : (
          <>
            {activeTab === "now"    && (
              <NowTab
                wx={locData.weather}
                alerts={alerts}
                units={units}
                loc={loc}
                onOpenMap={() => setActiveTab("map")}
              />
            )}
            {activeTab === "hourly"  && <HourlyTab  wx={locData.weather} units={units} />}
            {activeTab === "10-day"  && <TenDayTab  wx={locData.weather} units={units} loc={loc} />}
            {activeTab === "derived" && <DerivedTab wx={locData.weather} units={units} loc={loc} />}
            {activeTab === "map"     && <MapTab     activeLoc={loc} alerts={alerts} />}
            {activeTab === "alerts"  && <AlertsTab  alerts={alerts} allData={data} units={units} />}
          </>
        )}
      </main>

      <footer className="border-t border-slate px-5 py-3 flex justify-between flex-wrap gap-2">
        <span className="mono text-[9px] text-steel tracking-widest">
          DATA: OPEN-METEO · NWS · USGS · NO API KEY REQUIRED
        </span>
        <span className="mono text-[9px] text-steel tracking-widest">
          IQSPATIAL · @rmkenv · WEATHEROPS v2.2 · {model.toUpperCase()}
        </span>
      </footer>
    </div>
  );
}
