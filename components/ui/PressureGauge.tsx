interface Props { value: number }

export default function PressureGauge({ value }: Props) {
  const min = 980, max = 1040;
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const angle = -135 + pct * 270;
  const cx = 60, cy = 60, r = 48;
  const rad = (a: number) => (a * Math.PI) / 180;
  const nx = cx + r * Math.cos(rad(angle - 90));
  const ny = cy + r * Math.sin(rad(angle - 90));
  const arcColor = value < 1000 ? "#f0a500" : "#7ec8a0";

  return (
    <svg width="120" height="100" viewBox="0 0 120 100" aria-label={`${value} hPa`}>
      <path
        d={`M ${cx - r * Math.cos(rad(45))} ${cy + r * Math.sin(rad(45))} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(rad(45))} ${cy + r * Math.sin(rad(45))}`}
        fill="none" stroke="#1c2f4a" strokeWidth="8" strokeLinecap="round"
      />
      <path
        d={`M ${cx - r * Math.cos(rad(45))} ${cy + r * Math.sin(rad(45))} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${nx} ${ny}`}
        fill="none" stroke={arcColor} strokeWidth="8" strokeLinecap="round"
      />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#e8f0f8" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="4" fill="#3d7ab5" />
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#b8c8d8" fontSize="11" fontFamily="'Share Tech Mono', monospace">
        {value?.toFixed(0)} hPa
      </text>
    </svg>
  );
}
