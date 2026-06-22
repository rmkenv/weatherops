/**
 * NormalsRibbon — SVG sparkline with 30-year climatological context bands.
 * Shows:
 *   - P10–P90 shaded band (the "normal range")
 *   - P50 median line (dashed)
 *   - Actual forecast line (solid, colored by deviation)
 */
import type { ClimateNormal } from "@/services/weather/types";
import { cToF } from "@/lib/units";

interface Props {
  forecastDates: string[];   // YYYY-MM-DD
  forecastHigh: number[];    // °C tmax per day
  forecastLow: number[];     // °C tmin per day
  normals: (ClimateNormal | null)[];
  width?: number;
  height?: number;
}

export default function NormalsRibbon({
  forecastDates,
  forecastHigh,
  forecastLow,
  normals,
  width = 600,
  height = 80,
}: Props) {
  if (!forecastDates.length || !normals.length) return null;

  const n   = forecastDates.length;
  const pad = { top: 8, bottom: 8, left: 4, right: 4 };
  const w   = width  - pad.left - pad.right;
  const h   = height - pad.top  - pad.bottom;

  // Collect all values for scale
  const allVals: number[] = [];
  normals.forEach((nm) => {
    if (nm) {
      allVals.push(cToF(nm.tmax_p90), cToF(nm.tmax_p10), cToF(nm.tmin_p90), cToF(nm.tmin_p10));
    }
  });
  forecastHigh.forEach((v) => allVals.push(cToF(v)));
  forecastLow.forEach((v)  => allVals.push(cToF(v)));

  const minVal = Math.min(...allVals) - 2;
  const maxVal = Math.max(...allVals) + 2;
  const range  = maxVal - minVal;

  const xOf = (i: number) => pad.left + (i / (n - 1)) * w;
  const yOf = (v: number) => pad.top  + h - ((cToF(v) - minVal) / range) * h;
  const yOfF = (fv: number) => pad.top + h - ((fv - minVal) / range) * h;

  // Build polygon points for P10-P90 normal band (high)
  const bandHighTop    = normals.map((nm, i) => `${xOf(i)},${nm ? yOf(nm.tmax_p90) : yOfF(maxVal)}`).join(" ");
  const bandHighBottom = [...normals].reverse().map((nm, i) => `${xOf(n - 1 - i)},${nm ? yOf(nm.tmax_p10) : yOfF(minVal)}`).join(" ");
  const bandLowTop     = normals.map((nm, i) => `${xOf(i)},${nm ? yOf(nm.tmin_p90) : yOfF(maxVal)}`).join(" ");
  const bandLowBottom  = [...normals].reverse().map((nm, i) => `${xOf(n - 1 - i)},${nm ? yOf(nm.tmin_p10) : yOfF(minVal)}`).join(" ");

  const highLine = forecastHigh.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
  const lowLine  = forecastLow.map((v, i)  => `${xOf(i)},${yOf(v)}`).join(" ");
  const medHigh  = normals.filter(Boolean).map((nm, i) => `${xOf(i)},${yOf(nm!.tmax_p50)}`).join(" ");
  const medLow   = normals.filter(Boolean).map((nm, i) => `${xOf(i)},${yOf(nm!.tmin_p50)}`).join(" ");

  const labels = forecastDates.map((d, i) => {
    const date = new Date(d);
    return i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height + 16}`} style={{ overflow: "visible" }}>
        {/* High normal band */}
        <polygon points={`${bandHighTop} ${bandHighBottom}`} fill="#f0a500" opacity="0.08" />
        {/* Low normal band */}
        <polygon points={`${bandLowTop} ${bandLowBottom}`}   fill="#3d7ab5" opacity="0.10" />
        {/* Median lines */}
        {medHigh && <polyline points={medHigh} fill="none" stroke="#f0a500" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />}
        {medLow  && <polyline points={medLow}  fill="none" stroke="#3d7ab5" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />}
        {/* Forecast lines */}
        <polyline points={highLine} fill="none" stroke="#f0a500" strokeWidth="2" strokeLinejoin="round" />
        <polyline points={lowLine}  fill="none" stroke="#3d7ab5" strokeWidth="2" strokeLinejoin="round" />
        {/* Dots */}
        {forecastHigh.map((v, i) => (
          <circle key={`h${i}`} cx={xOf(i)} cy={yOf(v)} r="2.5" fill="#f0a500" />
        ))}
        {forecastLow.map((v, i) => (
          <circle key={`l${i}`} cx={xOf(i)} cy={yOf(v)} r="2.5" fill="#3d7ab5" />
        ))}
        {/* X labels */}
        {labels.map((lbl, i) => (
          <text key={i} x={xOf(i)} y={height + 14} textAnchor="middle" fill="#b8c8d8" fontSize="9" fontFamily="'Share Tech Mono', monospace">
            {lbl}
          </text>
        ))}
      </svg>

      <div className="flex gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-amber" />
          <span className="text-fog text-[10px]">Forecast High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-horizon" />
          <span className="text-fog text-[10px]">Forecast Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-amber opacity-50 border-dashed" style={{ borderTop: "1px dashed #f0a500", background: "none" }} />
          <span className="text-fog text-[10px]">30yr Normal (P10–P90)</span>
        </div>
      </div>
    </div>
  );
}
