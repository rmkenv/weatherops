/**
 * WindRose — compact SVG compass with directional arrow and speed ring.
 * Shows cardinal direction, speed, and a subtle arc indicating intensity.
 */
interface Props {
  speedMph: number;
  dirDeg: number;
  size?: number;
}

const CARDINAL = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

function cardinalFull(deg: number): string {
  return CARDINAL[Math.round(deg / 22.5) % 16];
}

function beaufortColor(mph: number): string {
  if (mph < 7)  return "#7ec8a0"; // calm / light
  if (mph < 18) return "#3d7ab5"; // breeze
  if (mph < 31) return "#f0a500"; // fresh
  return "#ff4444";               // strong / gale
}

function beaufortLabel(mph: number): string {
  if (mph < 1)  return "CALM";
  if (mph < 7)  return "LIGHT";
  if (mph < 18) return "BREEZE";
  if (mph < 25) return "FRESH";
  if (mph < 38) return "STRONG";
  return "GALE";
}

export default function WindRose({ speedMph, dirDeg, size = 110 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.38;
  const color = beaufortColor(speedMph);

  // Arrow points FROM the direction wind is coming from (met convention)
  // so we rotate the "pointing up" arrow by dirDeg + 180
  const arrowAngle = ((dirDeg + 180) * Math.PI) / 180;
  const arrowLen   = R * 0.62;
  const ax = cx + arrowLen * Math.sin(arrowAngle);
  const ay = cy - arrowLen * Math.cos(arrowAngle);

  // Speed ring arc — fill % based on beaufort 0-10
  const maxMph = 60;
  const arcPct = Math.min(1, speedMph / maxMph);
  const arcAngle = arcPct * 270; // sweep 270°
  const startDeg = -135;
  const endDeg   = startDeg + arcAngle;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcR  = R + 6;
  const arcSx = cx + arcR * Math.cos(toRad(startDeg));
  const arcSy = cy + arcR * Math.sin(toRad(startDeg));
  const arcEx = cx + arcR * Math.cos(toRad(endDeg));
  const arcEy = cy + arcR * Math.sin(toRad(endDeg));
  const largeArc = arcAngle > 180 ? 1 : 0;

  // Cardinal tick marks
  const ticks = [0, 90, 180, 270];
  const tickLabels: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Wind ${speedMph} mph ${cardinalFull(dirDeg)}`}>
      {/* Outer ring track */}
      <circle cx={cx} cy={cy} r={arcR} fill="none" stroke="#1c2f4a" strokeWidth="5" />

      {/* Speed arc */}
      {arcPct > 0 && (
        <path
          d={`M ${arcSx} ${arcSy} A ${arcR} ${arcR} 0 ${largeArc} 1 ${arcEx} ${arcEy}`}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* Compass rose background */}
      <circle cx={cx} cy={cy} r={R} fill="#0a1628" stroke="#2d4a6b" strokeWidth="1" />

      {/* Cardinal ticks */}
      {ticks.map((deg) => {
        const rad = toRad(deg - 90);
        const inner = R * 0.78;
        const outer = R * 0.95;
        return (
          <line
            key={deg}
            x1={cx + inner * Math.cos(rad)} y1={cy + inner * Math.sin(rad)}
            x2={cx + outer * Math.cos(rad)} y2={cy + outer * Math.sin(rad)}
            stroke="#2d4a6b" strokeWidth="1.5"
          />
        );
      })}

      {/* Cardinal labels */}
      {ticks.map((deg) => {
        const rad   = toRad(deg - 90);
        const dist  = R * 0.62;
        return (
          <text
            key={`lbl-${deg}`}
            x={cx + dist * Math.cos(rad)}
            y={cy + dist * Math.sin(rad) + 3.5}
            textAnchor="middle"
            fill="#2d4a6b"
            fontSize={size * 0.085}
            fontFamily="'Share Tech Mono', monospace"
          >
            {tickLabels[deg]}
          </text>
        );
      })}

      {/* Wind arrow */}
      <line
        x1={cx} y1={cy}
        x2={ax} y2={ay}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <circle cx={ax} cy={ay} r="3.5" fill={color} />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#3d7ab5" />

      {/* Speed readout */}
      <text x={cx} y={cy + R * 0.38} textAnchor="middle" fill="#e8f0f8"
        fontSize={size * 0.165} fontWeight="700" fontFamily="'Share Tech Mono', monospace">
        {speedMph.toFixed(0)}
      </text>
      <text x={cx} y={cy + R * 0.58} textAnchor="middle" fill="#b8c8d8"
        fontSize={size * 0.08} fontFamily="'Share Tech Mono', monospace">
        MPH
      </text>

      {/* Beaufort label below arc */}
      <text x={cx} y={size - 4} textAnchor="middle" fill={color}
        fontSize={size * 0.08} fontFamily="'Share Tech Mono', monospace" letterSpacing="1">
        {beaufortLabel(speedMph)} · {cardinalFull(dirDeg)}
      </text>
    </svg>
  );
}
