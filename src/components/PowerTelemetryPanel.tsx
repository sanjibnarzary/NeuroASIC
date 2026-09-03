import React from 'react';
import { AsicConfig, LedColor, PowerMetrics, ProcessNode } from '../types';
import { PROCESS_NODES } from '../utils/asicPhysics';
import { Zap, Gauge, Sliders, BatteryCharging, ShieldAlert, Cpu } from 'lucide-react';

interface PowerTelemetryPanelProps {
  config: AsicConfig;
  metrics: PowerMetrics;
  onConfigChange: (newConfig: Partial<AsicConfig>) => void;
}

export const PowerTelemetryPanel: React.FC<PowerTelemetryPanelProps> = ({
  config,
  metrics,
  onConfigChange,
}) => {
  const dynamicPct = Math.round(
    (metrics.dynamicPowerUw / Math.max(0.001, metrics.totalPowerUw)) * 100
  );
  const leakagePct = 100 - dynamicPct;

  // Comparison with standard Cortex-M4 MCU running same model with off-chip DRAM
  const mcuPowerUw = 45000; // 45 mW
  const mcuEnergyUj = 380; // 380 uJ
  const energyEfficiencyFactor = Math.max(
    1,
    Math.round(mcuEnergyUj / Math.max(0.01, metrics.energyPerInferenceUj))
  );

  return (
    <div
      id="asic-power-telemetry-panel"
      className="flex flex-col gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold font-mono text-zinc-100">
              LOW-POWER TELEMETRY & SILICON TUNING
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Near-threshold CMOS voltage scaling • Dynamic clock gating
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-semibold">
            <BatteryCharging className="w-3.5 h-3.5" />
            {energyEfficiencyFactor}x More Efficient than MCU
          </span>
        </div>
      </div>

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Power */}
        <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col">
          <span className="text-[11px] font-mono text-zinc-400">Total Power</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-zinc-100">
              {metrics.totalPowerUw < 1000
                ? `${metrics.totalPowerUw} µW`
                : `${(metrics.totalPowerUw / 1000).toFixed(2)} mW`}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            {metrics.dynamicPowerUw}µW dyn / {metrics.leakagePowerUw}µW leak
          </span>
        </div>

        {/* Energy per Inference */}
        <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col">
          <span className="text-[11px] font-mono text-zinc-400">Energy / Classification</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {metrics.energyPerInferenceUj} µJ
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-500/80 mt-1">
            Zero off-chip DRAM cost
          </span>
        </div>

        {/* Latency */}
        <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col">
          <span className="text-[11px] font-mono text-zinc-400">Inference Latency</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-sky-400">
              {metrics.latencyUs >= 1000
                ? `${(metrics.latencyUs / 1000).toFixed(2)} ms`
                : `${metrics.latencyUs} µs`}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            Throughput: ~{metrics.throughputFps.toLocaleString()} FPS
          </span>
        </div>

        {/* Silicon Footprint */}
        <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col">
          <span className="text-[11px] font-mono text-zinc-400">Silicon Die Area</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-amber-400">
              {metrics.siliconAreaMm2} mm²
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 mt-1">
            {metrics.totalGateCount} standard gates
          </span>
        </div>
      </div>

      {/* Dynamic vs Leakage Power Bar */}
      <div className="flex flex-col gap-1.5 p-3 bg-black/40 rounded-xl border border-zinc-900">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-500" />
            Dynamic (Switching) Power: {dynamicPct}% ({metrics.dynamicPowerUw} µW)
          </span>
          <span className="text-zinc-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            Static (Leakage) Power: {leakagePct}% ({metrics.leakagePowerUw} µW)
          </span>
        </div>
        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-800">
          <div
            className="h-full bg-sky-500 transition-all duration-200"
            style={{ width: `${dynamicPct}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-200"
            style={{ width: `${leakagePct}%` }}
          />
        </div>
      </div>

      {/* Silicon Controls & Tuning Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
        {/* VDD Voltage Scaling */}
        <div className="flex flex-col gap-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-300 font-semibold flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> VDD Core Voltage:
            </span>
            <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
              {config.vdd.toFixed(2)} V
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.2"
            step="0.05"
            value={config.vdd}
            onChange={(e) => onConfigChange({ vdd: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>0.50V (Near-threshold)</span>
            <span>1.20V (Nominal)</span>
          </div>
        </div>

        {/* Clock Frequency */}
        <div className="flex flex-col gap-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-300 font-semibold flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-sky-400" /> Clock Frequency:
            </span>
            <span className="text-sky-400 font-bold bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">
              {config.clockFreqKhz >= 1000
                ? `${(config.clockFreqKhz / 1000).toFixed(2)} MHz`
                : `${config.clockFreqKhz} kHz`}
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="10000"
            step="50"
            value={config.clockFreqKhz}
            onChange={(e) =>
              onConfigChange({ clockFreqKhz: parseInt(e.target.value, 10) })
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-zinc-400">
            <span>50 kHz (Ultra-low)</span>
            <span>10 MHz (High speed)</span>
          </div>
        </div>

        {/* Process Technology Node */}
        <div className="flex flex-col gap-2 p-3 bg-zinc-900/40 rounded-xl border border-zinc-800">
          <span className="text-xs font-mono text-zinc-300 font-semibold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" /> CMOS Process Node:
          </span>
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {(Object.keys(PROCESS_NODES) as ProcessNode[]).map((nodeKey) => (
              <button
                key={nodeKey}
                type="button"
                onClick={() => onConfigChange({ processNode: nodeKey })}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-medium transition border ${
                  config.processNode === nodeKey
                    ? 'bg-emerald-900/80 border-emerald-400 text-emerald-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {nodeKey === '180nm' ? '180nm' : nodeKey === '65nm_lp' ? '65nm LP' : '28nm SOI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Architectural Low-Power Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
        {/* Clock Gating Toggle */}
        <button
          type="button"
          onClick={() =>
            onConfigChange({ clockGatingEnabled: !config.clockGatingEnabled })
          }
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition ${
            config.clockGatingEnabled
              ? 'bg-emerald-950/40 border-emerald-500/60'
              : 'bg-zinc-900/60 border-zinc-800'
          }`}
        >
          <div>
            <div className="text-xs font-mono font-bold text-zinc-200">
              Integrated Clock Gating (ICG)
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              Shut down inactive PE / Memory clocks
            </div>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              config.clockGatingEnabled
                ? 'bg-emerald-500 border-emerald-400'
                : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            {config.clockGatingEnabled && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
          </div>
        </button>

        {/* Deep Sleep Power Gating */}
        <button
          type="button"
          onClick={() =>
            onConfigChange({ powerGatingSleep: !config.powerGatingSleep })
          }
          className={`p-3 rounded-xl border flex items-center justify-between text-left transition ${
            config.powerGatingSleep
              ? 'bg-purple-950/40 border-purple-500/60'
              : 'bg-zinc-900/60 border-zinc-800'
          }`}
        >
          <div>
            <div className="text-xs font-mono font-bold text-zinc-200">
              MTCMOS Deep Sleep Mode
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              Cut core power rail (0.02x leakage)
            </div>
          </div>
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              config.powerGatingSleep
                ? 'bg-purple-500 border-purple-400'
                : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            {config.powerGatingSleep && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
          </div>
        </button>

        {/* LED Color Selection */}
        <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-zinc-200">
              LED Display Phosphor
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
              Hardware emission wavelength
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {(['red', 'green', 'amber', 'blue'] as LedColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onConfigChange({ ledColor: c })}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  c === 'red'
                    ? 'bg-red-500'
                    : c === 'green'
                    ? 'bg-emerald-500'
                    : c === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
                } ${
                  config.ledColor === c
                    ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                title={`Select ${c} LED`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
