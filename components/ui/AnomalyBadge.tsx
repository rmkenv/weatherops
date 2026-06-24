/**
 * AnomalyBadge — shows how today's high compares to the 30-year median.
 * Requires climatology normals to already be loaded by the parent.
 */
import type { ClimateNormal } from "@/services/weather/types";
import { cToF } from "@/lib/units";

interface Props {
  currentTempC: number;
  normal: ClimateNormal | null;
  loading?: boolean;
}

export default function AnomalyBadge({ currentTempC, normal, loading }: Props) {
  if (loading) {
    return (
      <span className="mono text-[9px] text-steel tracking-widest px-2 py-0.5 rounded border border-steel">
        LOADING NORMALS…
      </span>
    );
  }
  if (!normal) return null;

  const currentF = cToF(currentTempC);
  const normalF  = cToF(normal.tmax_p50);
  const delta    = currentF - normalF;
  const absDelta = Math.abs(delta);

  if (absDelta < 1) {
    return (
      <span className="mono text-[9px] text-fog tracking-widest px-2 py-0.5 rounded border border-steel/50 bg-steel/10">
        NEAR NORMAL
      </span>
    );
  }

  const color  = delta > 0 ? "#f0a500" : "#3d7ab5";
  const arrow  = delta > 0 ? "↑" : "↓";
  const label  = delta > 0 ? "ABOVE" : "BELOW";
  const mag    = absDelta > 10 ? "MUCH " : absDelta > 5 ? "" : "";

  return (
    <span
      className="mono text-[10px] tracking-wide px-2 py-0.5 rounded border font-bold"
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {arrow} {absDelta.toFixed(0)}°F {mag}{label} NORMAL
    </span>
  );
}
