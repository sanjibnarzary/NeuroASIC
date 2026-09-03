import React from 'react';
import { LedColor } from '../types';

interface LedBarArrayProps {
  probabilities: number[];
  predictedDigit: number;
  color?: LedColor;
  isBusy?: boolean;
  isValid?: boolean;
  isSleep?: boolean;
  clockFreqKhz: number;
}

const LED_GLOW_STYLES: Record<
  LedColor,
  {
    bgActive: string;
    shadowActive: string;
    borderActive: string;
    textColor: string;
  }
> = {
  red: {
    bgActive: 'bg-red-500',
    shadowActive: 'shadow-[0_0_12px_rgba(239,68,68,0.9),0_0_24px_rgba(239,68,68,0.4)]',
    borderActive: 'border-red-400',
    textColor: 'text-red-400',
  },
  green: {
    bgActive: 'bg-emerald-500',
    shadowActive: 'shadow-[0_0_12px_rgba(16,185,129,0.9),0_0_24px_rgba(16,185,129,0.4)]',
    borderActive: 'border-emerald-400',
    textColor: 'text-emerald-400',
  },
  amber: {
    bgActive: 'bg-amber-500',
    shadowActive: 'shadow-[0_0_12px_rgba(245,158,11,0.9),0_0_24px_rgba(245,158,11,0.4)]',
    borderActive: 'border-amber-400',
    textColor: 'text-amber-400',
  },
  blue: {
    bgActive: 'bg-sky-500',
    shadowActive: 'shadow-[0_0_12px_rgba(14,165,233,0.9),0_0_24px_rgba(14,165,233,0.4)]',
    borderActive: 'border-sky-400',
    textColor: 'text-sky-400',
  },
};

export const LedBarArray: React.FC<LedBarArrayProps> = ({
  probabilities,
  predictedDigit,
  color = 'red',
  isBusy = false,
  isValid = true,
  isSleep = false,
  clockFreqKhz,
}) => {
  const theme = LED_GLOW_STYLES[color] || LED_GLOW_STYLES.red;

  return (
    <div
      id="asic-led-status-panel"
      className="flex flex-col gap-3 p-4 bg-zinc-950 border border-zinc-800/80 rounded-2xl shadow-lg"
    >
      {/* Header with hardware telemetry indicators */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-300">
            DISCRETE LED ARRAY (CH 0-9)
          </span>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            SINK DRIVER
          </span>
        </div>
        <div className="text-[10px] font-mono text-zinc-400">
          V_DROP: 1.85V @ 4mA
        </div>
      </div>

      {/* 10-Channel Annunciator Array */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Array.from({ length: 10 }).map((_, digit) => {
          const prob = probabilities[digit] ?? 0;
          const isWinner = digit === predictedDigit && isValid && !isSleep;
          const pct = Math.round(prob * 100);

          return (
            <div
              key={digit}
              id={`led-channel-${digit}`}
              className={`flex flex-col items-center p-2 rounded-xl border transition-all duration-150 ${
                isWinner
                  ? 'bg-zinc-900/90 border-zinc-700 shadow-md scale-102'
                  : 'bg-zinc-900/30 border-zinc-900'
              }`}
            >
              {/* Digit label */}
              <span className="text-xs font-mono font-bold text-zinc-400 mb-1.5">
                [{digit}]
              </span>

              {/* Physical circular SMD LED diode */}
              <div
                className={`relative w-4 h-4 rounded-full border transition-all duration-100 flex items-center justify-center ${
                  isWinner
                    ? `${theme.bgActive} ${theme.borderActive} ${theme.shadowActive}`
                    : prob > 0.15 && !isSleep
                    ? 'bg-zinc-700 border-zinc-600 shadow-[0_0_6px_rgba(255,255,255,0.2)]'
                    : 'bg-zinc-900 border-zinc-800 shadow-inner'
                }`}
              >
                {/* Internal diode die reflect point */}
                <div className="w-1 h-1 rounded-full bg-white/40" />
              </div>

              {/* Activation percentage gauge bar */}
              <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-100 ${
                    isWinner ? theme.bgActive : 'bg-zinc-600'
                  }`}
                  style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
                />
              </div>

              {/* Numeric percentage */}
              <span
                className={`text-[9px] font-mono mt-1 ${
                  isWinner ? theme.textColor + ' font-bold' : 'text-zinc-400'
                }`}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Chip Peripheral Status Pin LEDs */}
      <div className="mt-1 pt-2.5 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          <span className="text-zinc-400">PWR_GOOD (VDD)</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              !isSleep
                ? 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)] animate-pulse'
                : 'bg-zinc-800'
            }`}
          />
          <span className="text-zinc-400">
            CLK ({clockFreqKhz >= 1000 ? `${(clockFreqKhz / 1000).toFixed(1)}MHz` : `${clockFreqKhz}kHz`})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              isBusy
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-ping'
                : 'bg-zinc-800'
            }`}
          />
          <span className="text-zinc-400">INFER_BUSY</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              isValid && !isSleep
                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                : 'bg-zinc-800'
            }`}
          />
          <span className="text-zinc-400">VALID_STROBE</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              isSleep
                ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.9)]'
                : 'bg-zinc-800'
            }`}
          />
          <span className="text-zinc-400">SLEEP_GATE</span>
        </div>
      </div>
    </div>
  );
};
