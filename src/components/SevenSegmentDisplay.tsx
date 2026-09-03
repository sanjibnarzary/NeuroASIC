import React from 'react';
import { LedColor } from '../types';

interface SevenSegmentDisplayProps {
  segments: {
    a: boolean;
    b: boolean;
    c: boolean;
    d: boolean;
    e: boolean;
    f: boolean;
    g: boolean;
    dp: boolean;
  };
  color?: LedColor;
  digitValue?: number;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

const COLOR_MAP: Record<
  LedColor,
  {
    onFill: string;
    onGlow: string;
    offFill: string;
    textColor: string;
    borderGlow: string;
  }
> = {
  red: {
    onFill: '#ff2d20',
    onGlow: '0 0 16px rgba(255, 45, 32, 0.85), 0 0 32px rgba(255, 45, 32, 0.45)',
    offFill: '#240b0b',
    textColor: 'text-red-500',
    borderGlow: 'border-red-900/40 shadow-[0_0_24px_rgba(255,45,32,0.15)]',
  },
  green: {
    onFill: '#10b981',
    onGlow: '0 0 16px rgba(16, 185, 129, 0.85), 0 0 32px rgba(16, 185, 129, 0.45)',
    offFill: '#062016',
    textColor: 'text-emerald-500',
    borderGlow: 'border-emerald-900/40 shadow-[0_0_24px_rgba(16,185,129,0.15)]',
  },
  amber: {
    onFill: '#f59e0b',
    onGlow: '0 0 16px rgba(245, 158, 11, 0.85), 0 0 32px rgba(245, 158, 11, 0.45)',
    offFill: '#241604',
    textColor: 'text-amber-500',
    borderGlow: 'border-amber-900/40 shadow-[0_0_24px_rgba(245,158,11,0.15)]',
  },
  blue: {
    onFill: '#38bdf8',
    onGlow: '0 0 16px rgba(56, 189, 248, 0.85), 0 0 32px rgba(56, 189, 248, 0.45)',
    offFill: '#0b1928',
    textColor: 'text-sky-400',
    borderGlow: 'border-sky-900/40 shadow-[0_0_24px_rgba(56,189,248,0.15)]',
  },
};

export const SevenSegmentDisplay: React.FC<SevenSegmentDisplayProps> = ({
  segments,
  color = 'red',
  digitValue,
  confidence = 0,
  size = 'lg',
  active = true,
}) => {
  const theme = COLOR_MAP[color] || COLOR_MAP.red;

  // Segment geometry polygons: (100 x 180 coordinate space)
  // Horizontal segments:
  const segA = 'M 22 18 L 30 10 L 70 10 L 78 18 L 70 26 L 30 26 Z';
  const segG = 'M 22 90 L 30 82 L 70 82 L 78 90 L 70 98 L 30 98 Z';
  const segD = 'M 22 162 L 30 154 L 70 154 L 78 162 L 70 170 L 30 170 Z';

  // Vertical segments:
  const segF = 'M 18 22 L 26 30 L 26 80 L 18 88 L 10 80 L 10 30 Z';
  const segB = 'M 82 22 L 90 30 L 90 80 L 82 88 L 74 80 L 74 30 Z';
  const segE = 'M 18 92 L 26 100 L 26 150 L 18 158 L 10 150 L 10 100 Z';
  const segC = 'M 82 92 L 90 100 L 90 150 L 82 158 L 74 150 L 74 100 Z';

  const isSegmentOn = (on: boolean) => active && on;

  const getStyle = (isOn: boolean) => ({
    fill: isOn ? theme.onFill : theme.offFill,
    filter: isOn ? `drop-shadow(${theme.onGlow})` : 'none',
    transition: 'fill 0.08s ease-in-out, filter 0.08s ease-in-out',
  });

  const dimensions =
    size === 'lg'
      ? { width: 140, height: 210, box: 'p-4' }
      : size === 'md'
      ? { width: 90, height: 135, box: 'p-2.5' }
      : { width: 60, height: 90, box: 'p-1.5' };

  // Calculate binary representation of current active segments: {a,b,c,d,e,f,g}
  const binaryBus = [
    segments.a ? 1 : 0,
    segments.b ? 1 : 0,
    segments.c ? 1 : 0,
    segments.d ? 1 : 0,
    segments.e ? 1 : 0,
    segments.f ? 1 : 0,
    segments.g ? 1 : 0,
  ].join('');

  return (
    <div
      id="seven-segment-physical-unit"
      className={`relative flex flex-col items-center bg-zinc-950 border rounded-2xl ${theme.borderGlow} ${dimensions.box}`}
    >
      {/* Metallic display bezel header */}
      <div className="w-full flex items-center justify-between pb-2 mb-1 border-b border-zinc-800/80 px-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span className="text-[11px] font-mono tracking-wider font-semibold text-zinc-400">
            LED_OUTPUT_BUS
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          7-SEG BCD
        </span>
      </div>

      {/* Physical 7-segment LED SVG lens */}
      <div className="relative flex items-center justify-center p-2 bg-gradient-to-b from-black via-zinc-950 to-black rounded-xl border border-zinc-800/60 shadow-inner">
        <svg
          viewBox="0 0 110 180"
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible"
        >
          {/* Segment A */}
          <path
            id="seg-a"
            d={segA}
            style={getStyle(isSegmentOn(segments.a))}
            className="cursor-default"
          />
          {/* Segment B */}
          <path
            id="seg-b"
            d={segB}
            style={getStyle(isSegmentOn(segments.b))}
            className="cursor-default"
          />
          {/* Segment C */}
          <path
            id="seg-c"
            d={segC}
            style={getStyle(isSegmentOn(segments.c))}
            className="cursor-default"
          />
          {/* Segment D */}
          <path
            id="seg-d"
            d={segD}
            style={getStyle(isSegmentOn(segments.d))}
            className="cursor-default"
          />
          {/* Segment E */}
          <path
            id="seg-e"
            d={segE}
            style={getStyle(isSegmentOn(segments.e))}
            className="cursor-default"
          />
          {/* Segment F */}
          <path
            id="seg-f"
            d={segF}
            style={getStyle(isSegmentOn(segments.f))}
            className="cursor-default"
          />
          {/* Segment G */}
          <path
            id="seg-g"
            d={segG}
            style={getStyle(isSegmentOn(segments.g))}
            className="cursor-default"
          />
          {/* Decimal Point (DP) */}
          <circle
            id="seg-dp"
            cx="98"
            cy="164"
            r="6"
            style={getStyle(isSegmentOn(segments.dp || active))}
          />

          {/* Segment letter annotations in faint silver */}
          {size === 'lg' && (
            <g className="fill-zinc-400 text-[8px] font-mono select-none" opacity="0.6">
              <text x="48" y="20">A</text>
              <text x="80" y="55">B</text>
              <text x="80" y="125">C</text>
              <text x="48" y="165">D</text>
              <text x="14" y="125">E</text>
              <text x="14" y="55">F</text>
              <text x="48" y="93">G</text>
              <text x="94" y="155">DP</text>
            </g>
          )}
        </svg>
      </div>

      {/* Live Hardware Bus Readout */}
      <div className="w-full mt-3 pt-2 border-t border-zinc-800/80 flex flex-col gap-1.5 px-1 font-mono text-[11px]">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Decoded Digit:</span>
          <span className={`text-base font-bold font-mono ${theme.textColor}`}>
            {active && digitValue !== undefined ? digitValue : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span>Confidence:</span>
          <span className="text-zinc-200 font-semibold font-mono">
            {active ? `${(confidence * 100).toFixed(1)}%` : '0.0%'}
          </span>
        </div>
        <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-900">
          <span>Pins [6:0]:</span>
          <span className="text-zinc-400 font-mono tracking-widest text-[10px]">
            {active ? `7'b${binaryBus}` : "7'b0000000"}
          </span>
        </div>
      </div>
    </div>
  );
};
