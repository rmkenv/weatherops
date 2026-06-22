"use client";
/**
 * MapTab — Leaflet map with:
 *   - NEXRAD composite radar tiles (Iowa Mesonet, free)
 *   - USGS streamgauge markers (WaterWatch API)
 *   - NWS alert zone polygons
 *   - Location pins
 * Leaflet is loaded dynamically to avoid SSR issues.
 */
import { useEffect, useRef, useState } from "react";
import type { Location } from "@/lib/constants";
import { LOCATIONS } from "@/lib/constants";
import type { NwsAlert } from "@/services/alerts/client";
import { SEVERITY_COLORS } from "@/services/alerts/client";
import SectionLabel from "@/components/ui/SectionLabel";

interface Gauge {
  siteNo: string;
  siteName: string;
  lat: number;
  lon: number;
  valueF: number;   // current discharge cfs
  floodStage: number | null;
  currentStage: number | null;
  status: "normal" | "action" | "flood" | "major";
}

async function fetchUSGSGauges(lat: number, lon: number, radiusMi = 50): Promise<Gauge[]> {
  try {
    const bbox = `${lon - 0.8},${lat - 0.6},${lon + 0.8},${lat + 0.6}`;
    const url  = `https://waterservices.usgs.gov/nwis/iv/?format=json&bBox=${bbox}&parameterCd=00060,00065&siteStatus=active`;
    const res  = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const sites = data?.value?.timeSeries ?? [];
    const gaugeMap: Record<string, Partial<Gauge>> = {};
    for (const ts of sites) {
      const siteNo   = ts.sourceInfo.siteCode[0].value;
      const siteName = ts.sourceInfo.siteName;
      const slat     = parseFloat(ts.sourceInfo.geoLocation.geogLocation.latitude);
      const slon     = parseFloat(ts.sourceInfo.geoLocation.geogLocation.longitude);
      const paramCd  = ts.variable.variableCode[0].value;
      const val      = parseFloat(ts.values?.[0]?.value?.[0]?.value ?? "NaN");
      if (!gaugeMap[siteNo]) gaugeMap[siteNo] = { siteNo, siteName, lat: slat, lon: slon, status: "normal", floodStage: null, currentStage: null, valueF: 0 };
      if (paramCd === "00065") gaugeMap[siteNo].currentStage = isNaN(val) ? null : val;
      if (paramCd === "00060") gaugeMap[siteNo].valueF = isNaN(val) ? 0 : val;
    }
    return Object.values(gaugeMap).filter((g) => g.lat && g.lon).map((g) => {
      const stage = g.currentStage ?? 0;
      const flood = g.floodStage ?? 999;
      const status: Gauge["status"] =
        stage >= flood * 1.5 ? "major" :
        stage >= flood       ? "flood" :
        stage >= flood * 0.8 ? "action" : "normal";
      return { ...g, status } as Gauge;
    }).slice(0, 30);
  } catch { return []; }
}

const GAUGE_COLORS: Record<Gauge["status"], string> = {
  normal: "#7ec8a0",
  action: "#f0a500",
  flood:  "#ff6b35",
  major:  "#ff2244",
};

interface Props {
  activeLoc: Location;
  alerts: NwsAlert[];
}

export default function MapTab({ activeLoc, alerts }: Props) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);
  const mapObjRef = useRef<any>(null);
  const [gauges, setGauges] = useState<Gauge[]>([]);
  const [radarOn,   setRadarOn]   = useState(true);
  const [gaugesOn,  setGaugesOn]  = useState(true);
  const [alertsOn,  setAlertsOn]  = useState(true);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchUSGSGauges(activeLoc.lat, activeLoc.lon).then(setGauges);
  }, [activeLoc]);

  useEffect(() => {
    if (!mapRef.current) return;
    let map: any;

    async function initMap() {
      setLoading(true);
      const L = await import("leaflet" as any);

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      leafletRef.current = L;

      if (mapObjRef.current) {
        mapObjRef.current.remove();
        mapObjRef.current = null;
      }

      map = L.map(mapRef.current!, {
        center:  [activeLoc.lat, activeLoc.lon],
        zoom:    8,
        zoomControl: true,
      });
      mapObjRef.current = map;

      // Base tile — dark CartoDB
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 19,
      }).addTo(map);

      // NEXRAD radar overlay (Iowa Mesonet)
      const radarLayer = L.tileLayer(
        "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
        { opacity: 0.65, attribution: "NEXRAD · Iowa Mesonet" }
      );
      if (radarOn) radarLayer.addTo(map);

      // Location pins
      for (const loc of LOCATIONS) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:#3d7ab5;border:2px solid #e8f0f8;border-radius:50%;width:12px;height:12px;box-shadow:0 0 8px #3d7ab5"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        L.marker([loc.lat, loc.lon], { icon })
          .bindPopup(`<b style="color:#0a1628">${loc.label}</b>`)
          .addTo(map);
      }

      // Gauge markers
      if (gaugesOn) {
        for (const g of gauges) {
          const color = GAUGE_COLORS[g.status];
          const icon = L.divIcon({
            className: "",
            html: `<div style="background:${color};border:1.5px solid #0a1628;border-radius:3px;width:8px;height:8px;box-shadow:0 0 4px ${color}80"></div>`,
            iconSize: [8, 8],
            iconAnchor: [4, 4],
          });
          L.marker([g.lat, g.lon], { icon })
            .bindPopup(`
              <div style="font-family:monospace;font-size:12px;color:#0a1628">
                <b>${g.siteName}</b><br/>
                ${g.currentStage !== null ? `Stage: ${g.currentStage.toFixed(1)} ft<br/>` : ""}
                ${g.valueF ? `Flow: ${g.valueF.toLocaleString()} cfs<br/>` : ""}
                Status: <span style="color:${color};font-weight:bold">${g.status.toUpperCase()}</span>
              </div>
            `)
            .addTo(map);
        }
      }

      // NWS alert zones — fetch GeoJSON for each alert area
      if (alertsOn && alerts.length > 0) {
        for (const alert of alerts.slice(0, 3)) {
          try {
            const res = await fetch(`https://api.weather.gov/alerts/${encodeURIComponent(alert.id)}`);
            if (!res.ok) continue;
            const data = await res.json();
            if (data.geometry) {
              L.geoJSON(data.geometry, {
                style: {
                  color:   SEVERITY_COLORS[alert.severity] ?? "#b8c8d8",
                  weight:  2,
                  opacity: 0.8,
                  fillOpacity: 0.12,
                  fillColor: SEVERITY_COLORS[alert.severity] ?? "#b8c8d8",
                },
              })
                .bindPopup(`<b style="color:#0a1628">${alert.event}</b><br/><span style="font-size:11px;color:#444">${alert.headline}</span>`)
                .addTo(map);
            }
          } catch { /* geometry unavailable */ }
        }
      }

      setLoading(false);
    }

    initMap();

    return () => {
      if (mapObjRef.current) { mapObjRef.current.remove(); mapObjRef.current = null; }
    };
  }, [activeLoc, gauges, radarOn, gaugesOn, alertsOn, alerts]);

  return (
    <div>
      {/* Layer controls */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <SectionLabel>Map Layers</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "NEXRAD Radar", state: radarOn,  setter: setRadarOn,  color: "#7ec8a0" },
            { label: "USGS Gauges",  state: gaugesOn, setter: setGaugesOn, color: "#3d7ab5" },
            { label: "NWS Alerts",   state: alertsOn, setter: setAlertsOn, color: "#f0a500" },
          ].map(({ label, state, setter, color }) => (
            <button
              key={label}
              onClick={() => setter((p: boolean) => !p)}
              className="mono text-[10px] tracking-widest px-2.5 py-1 rounded border transition-colors"
              style={{
                borderColor: state ? color : "#2d4a6b",
                color:       state ? color : "#b8c8d8",
                background:  state ? `${color}18` : "transparent",
              }}
            >
              {state ? "●" : "○"} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="relative rounded-lg overflow-hidden" style={{ height: 460 }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-navy/80">
            <div className="mono text-horizon text-xs tracking-widest">LOADING MAP…</div>
          </div>
        )}
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>

      {/* Gauge legend */}
      <div className="flex gap-4 mt-3 flex-wrap">
        <span className="mono text-[9px] text-steel tracking-widest">GAUGE STATUS:</span>
        {Object.entries(GAUGE_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
            <span className="mono text-[9px] text-fog capitalize">{status}</span>
          </div>
        ))}
        <span className="mono text-[9px] text-steel ml-auto">
          {gauges.length} gauges loaded · NEXRAD composite reflectivity
        </span>
      </div>

      {/* Link Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
    </div>
  );
}
