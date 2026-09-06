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
  { key: 'maximalkraft', label: 'Max-Kraft', angle: -Math.PI / 2 }, // Top (12:00)
  { key: 'kraftausdauer', label: 'Kraft-Ausd.', angle: -Math.PI / 2 + Math.PI / 3 }, // Top-Right (02:00)
  { key: 'technik', label: 'Technik', angle: -Math.PI / 2 + (2 * Math.PI) / 3 }, // Bottom-Right (04:00)
  { key: 'balance', label: 'Balance', angle: -Math.PI / 2 + Math.PI }, // Bottom (06:00)
  { key: 'koordination', label: 'Koordination', angle: -Math.PI / 2 + (4 * Math.PI) / 3 }, // Bottom-Left (08:00)
  { key: 'flexibilitaet', label: 'Flexibilität', angle: -Math.PI / 2 + (5 * Math.PI) / 3 }, // Top-Left (10:00)
];

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  referenceData,
  size = 280,
  showLabels = true,
  accentColor = '#C9A96E', // SPEC-005 Sandstone
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
      let val = radar[key];
      if (val === undefined) {
        if (key === 'maximalkraft') val = radar.kraft ?? 3;
        else if (key === 'kraftausdauer') val = 3;
        else val = 3;
      }
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
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
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
              stroke="#333333"
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
              stroke="#333333"
              strokeWidth="1"
            />
          );
        })}

        {/* Reference data polygon (e.g. Setter Initial) if provided */}
        {refPoints && (
          <polygon
            points={refPoints}
            fill="none"
            stroke="#6B6358"
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
          strokeWidth="2"
          strokeLinejoin="round"
          className="transition-all duration-300 ease-out"
        />

        {/* Data points on vertices */}
        {AXIS_CONFIG.map(({ key, angle }, idx) => {
          let val = data[key];
          if (val === undefined) {
            val = (key === 'maximalkraft' ? data.kraft : 3) ?? 3;
          }
          const { x, y } = getCoordinates(val, angle);
          return (
            <circle
              key={`point-${idx}`}
              cx={x}
              cy={y}
              r="4"
              fill="#121212"
              stroke={accentColor}
              strokeWidth="2"
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
            let val = data[key];
            if (val === undefined) {
              val = (key === 'maximalkraft' ? data.kraft : 3) ?? 3;
            }

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
                  className="fill-[#A89F91] text-[10px] font-bold uppercase tracking-wider font-headline"
                >
                  {label}
                </text>
                <text
                  x={lx}
                  y={ly + 10}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-[#E8E0D4] text-[10px] font-mono font-bold"
                >
                  {val.toFixed(1)}/5
                </text>
              </g>
            );
          })}
      </svg>

      {/* Legend if referenceData is provided */}
      {referenceData && (
        <div className="flex items-center gap-4 text-[11px] mt-2 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-none" style={{ backgroundColor: accentColor }} />
            <span className="text-[#E8E0D4]">Community</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#6B6358]" />
            <span className="text-[#A89F91]">Schrauber</span>
          </div>
        </div>
      )}
    </div>
  );
};
