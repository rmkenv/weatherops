interface Props {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ values, color = "#3d7ab5", width = 600, height = 56 }: Props) {
  if (!values.length) return null;
  const min   = Math.min(...values);
  const max   = Math.max(...values);
  const range = max - min || 1;
  const pad   = { x: 2, y: 4 };
  const w     = width  - pad.x * 2;
  const h     = height - pad.y * 2;

  const pts = values
    .map((v, i) => {
      const x = pad.x + (i / (values.length - 1)) * w;
      const y = pad.y + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  // Gradient fill under line
  const fillId = `fill-${color.replace("#", "")}`;
  const firstY = pad.y + h - ((values[0] - min) / range) * h;
  const lastY  = pad.y + h - ((values[values.length - 1] - min) / range) * h;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ overflow: "visible", display: "block" }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon
        points={`${pad.x},${height - pad.y} ${pts} ${width - pad.x},${height - pad.y}`}
        fill={`url(#${fillId})`}
      />
      {/* Line */}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
