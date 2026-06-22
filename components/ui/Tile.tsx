interface Props {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: string;
}

export default function Tile({ label, value, unit, sub, accent = "#2d4a6b" }: Props) {
  return (
    <div style={{ borderTop: `2px solid ${accent}` }}
      className="bg-slate rounded-md px-3.5 py-3">
      <div className="text-fog text-[10px] tracking-wide uppercase">{label}</div>
      <div className="mono text-paper text-2xl font-bold mt-0.5 leading-none">
        {value}
        {unit && <span className="text-xs text-fog ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-horizon text-[11px] mt-1">{sub}</div>}
    </div>
  );
}
