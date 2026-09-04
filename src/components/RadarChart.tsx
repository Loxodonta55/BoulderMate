import React from 'react';
import { RadarAttributes } from '../types/boulder';

interface RadarChartProps {
  data: RadarAttributes;
  referenceData?: RadarAttributes; // e.g. Setter initial reference
  size?: number;
  showLabels?: boolean;
  accentColor?: string; // hex or Tailwind color
}

const AXIS_CONFIG: { key: keyof RadarAttributes; label: string; angle: number }[] = [
  { key: 'kraft', label: 'Kraft', angle: -Math.PI / 2 }, // Top
  { key: 'technik', label: 'Technik', angle: -Math.PI / 2 + (2 * Math.PI) / 5 }, // Top-Right
  { key: 'balance', label: 'Balance', angle: -Math.PI / 2 + (4 * Math.PI) / 5 }, // Bottom-Right
  { key: 'koordination', label: 'Koordination', angle: -Math.PI / 2 + (6 * Math.PI) / 5 }, // Bottom-Left
  { key: 'flexibilitaet', label: 'Flexibilität', angle: -Math.PI / 2 + (8 * Math.PI) / 5 }, // Top-Left
];

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  referenceData,
  size = 280,
  showLabels = true,
  accentColor = '#f59e0b', // amber-500
}) => {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.65;
  const levels = [1, 2, 3, 4, 5];

  // Helper to calculate coordinates from value (1-5) and angle
  const getCoordinates = (value: number, angle: number) => {
    // Clamp value between 1 and 5
    const clamped = Math.max(1, Math.min(5, value));
    const radius = (clamped / 5) * maxRadius;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  };

  // Build polygon points string for a given RadarAttributes set
  const getPolygonPoints = (radar: RadarAttributes) => {
    return AXIS_CONFIG.map(({ key, angle }) => {
      const val = radar[key] || 3;
      const { x, y } = getCoordinates(val, angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const primaryPoints = getPolygonPoints(data);
  const refPoints = referenceData ? getPolygonPoints(referenceData) : null;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible select-none"
      >
        {/* Background Gradients & Filters */}
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* Concentric grid rings (levels 1 to 5) */}
        {levels.map(lvl => {
          const ringPoints = AXIS_CONFIG.map(({ angle }) => {
            const { x, y } = getCoordinates(lvl, angle);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');

          return (
            <polygon
              key={`ring-${lvl}`}
              points={ringPoints}
              fill="none"
              stroke="#334155"
              strokeWidth={lvl === 5 ? '1.5' : '0.75'}
              strokeDasharray={lvl < 5 ? '3 3' : undefined}
              className="transition-all"
            />
          );
        })}

        {/* Radial spoke lines from center to outer ring */}
        {AXIS_CONFIG.map(({ angle }, idx) => {
          const outer = getCoordinates(5, angle);
          return (
            <line
              key={`spoke-${idx}`}
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#334155"
              strokeWidth="1"
            />
          );
        })}

        {/* Reference data polygon (e.g. Setter Initial) if provided */}
        {refPoints && (
          <polygon
            points={refPoints}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="opacity-60"
          />
        )}

        {/* Primary Data Polygon (Aggregated or User Data) */}
        <polygon
          points={primaryPoints}
          fill="url(#radarGlow)"
          stroke={accentColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          className="transition-all duration-500 ease-out filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.2)]"
        />

        {/* Data points on vertices */}
        {AXIS_CONFIG.map(({ key, angle }, idx) => {
          const val = data[key] || 3;
          const { x, y } = getCoordinates(val, angle);
          return (
            <circle
              key={`point-${idx}`}
              cx={x}
              cy={y}
              r="4.5"
              fill="#0f172a"
              stroke={accentColor}
              strokeWidth="2.5"
              className="transition-all duration-300"
            />
          );
        })}

        {/* Axis Labels & Values */}
        {showLabels &&
          AXIS_CONFIG.map(({ key, label, angle }, idx) => {
            const labelDist = maxRadius + 24;
            const lx = center + labelDist * Math.cos(angle);
            const ly = center + labelDist * Math.sin(angle);
            const val = data[key] || 3;

            // Alignment based on angle
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (Math.abs(angle - -Math.PI / 2) < 0.1) {
              textAnchor = 'middle';
            } else if (Math.cos(angle) > 0.1) {
              textAnchor = 'start';
            } else if (Math.cos(angle) < -0.1) {
              textAnchor = 'end';
            }

            return (
              <g key={`label-${idx}`}>
                <text
                  x={lx}
                  y={ly - 4}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-slate-300 text-[11px] font-bold tracking-tight"
                >
                  {label}
                </text>
                <text
                  x={lx}
                  y={ly + 10}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-amber-400 text-[10px] font-extrabold"
                >
                  {val.toFixed(1)}/5
                </text>
              </g>
            );
          })}
      </svg>

      {/* Legend if referenceData is provided */}
      {referenceData && (
        <div className="flex items-center gap-4 text-[11px] mt-2 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-slate-200">Community Schnitt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" />
            <span className="text-slate-400">Schrauber-Basis</span>
          </div>
        </div>
      )}
    </div>
  );
};
