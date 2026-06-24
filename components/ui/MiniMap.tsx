"use client";
/**
 * MiniMap — compact Leaflet map for the Now tab.
 * Shows NEXRAD radar + location pin. No gauges or alert polygons
 * (those live in the full MapTab). Clicking opens MapTab.
 */
import { useEffect, useRef, useState } from "react";
import type { Location } from "@/lib/constants";

interface Props {
  loc: Location;
  onOpenMap?: () => void;
}

export default function MiniMap({ loc, onOpenMap }: Props) {
  const mapRef   = useRef<HTMLDivElement>(null);
  const mapObj   = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = await import("leaflet" as any);

      if (cancelled || !mapRef.current) return;

      // Fix webpack icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }

      const map = L.map(mapRef.current, {
        center:          [loc.lat, loc.lon],
        zoom:            9,
        zoomControl:     false,
        scrollWheelZoom: false,
        dragging:        false,
        doubleClickZoom: false,
        attributionControl: false,
      });
      mapObj.current = map;

      // Dark base
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      // NEXRAD radar
      L.tileLayer(
        "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png",
        { opacity: 0.70 }
      ).addTo(map);

      // Location pin — glowing dot
      const pin = L.divIcon({
        className: "",
        html: `
          <div style="
            width:14px;height:14px;
            background:#3d7ab5;
            border:2px solid #e8f0f8;
            border-radius:50%;
            box-shadow:0 0 0 4px rgba(61,122,181,0.3), 0 0 12px rgba(61,122,181,0.6);
          "></div>`,
        iconSize:   [14, 14],
        iconAnchor: [7, 7],
      });
      L.marker([loc.lat, loc.lon], { icon: pin }).addTo(map);

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
    };
  }, [loc]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer group"
        style={{ height: 200 }}
        onClick={onOpenMap}
        title="Click to open full map"
      >
        {/* Map */}
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Loading overlay */}
        {!ready && (
          <div className="absolute inset-0 bg-navy flex items-center justify-center">
            <span className="mono text-horizon text-[10px] tracking-widest">LOADING RADAR…</span>
          </div>
        )}

        {/* "Open map" overlay on hover */}
        <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <span className="mono text-paper text-xs tracking-widest bg-navy/70 px-3 py-1.5 rounded-md border border-horizon">
            OPEN FULL MAP →
          </span>
        </div>

        {/* Location label */}
        <div className="absolute bottom-2 left-2 bg-navy/80 rounded px-2 py-0.5 pointer-events-none">
          <span className="mono text-paper text-[10px] tracking-wide">{loc.label}</span>
        </div>

        {/* NEXRAD credit */}
        <div className="absolute bottom-2 right-2 bg-navy/60 rounded px-1.5 py-0.5 pointer-events-none">
          <span className="mono text-steel text-[8px]">NEXRAD · Iowa Mesonet</span>
        </div>
      </div>
    </>
  );
}
