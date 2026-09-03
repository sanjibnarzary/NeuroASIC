import React, { useState } from 'react';
import { ASIC_DIE_BLOCKS, PROCESS_NODES } from '../utils/asicPhysics';
import { AsicConfig, DieBlock, PowerMetrics } from '../types';
import { Layers, Activity, Zap, FileCode, CheckCircle2 } from 'lucide-react';

interface SiliconDieFloorplanProps {
  config: AsicConfig;
  metrics: PowerMetrics;
  isBusy: boolean;
  activeFsmState: string;
}

export const SiliconDieFloorplan: React.FC<SiliconDieFloorplanProps> = ({
  config,
  metrics,
  isBusy,
  activeFsmState,
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>('sram_input_buf');
  const selectedBlock =
    ASIC_DIE_BLOCKS.find((b) => b.id === selectedBlockId) || ASIC_DIE_BLOCKS[0];
  const node = PROCESS_NODES[config.processNode] || PROCESS_NODES['65nm_lp'];

  const getCategoryColor = (category: DieBlock['category']) => {
    switch (category) {
      case 'memory':
        return {
          bg: 'bg-blue-950/40 hover:bg-blue-900/60',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          activeBg: 'bg-blue-900/80 border-blue-400 ring-2 ring-blue-500/40',
        };
      case 'compute':
        return {
          bg: 'bg-emerald-950/40 hover:bg-emerald-900/60',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          activeBg: 'bg-emerald-900/80 border-emerald-400 ring-2 ring-emerald-500/40',
        };
      case 'control':
        return {
          bg: 'bg-amber-950/40 hover:bg-amber-900/60',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          activeBg: 'bg-amber-900/80 border-amber-400 ring-2 ring-amber-500/40',
        };
      case 'io':
        return {
          bg: 'bg-rose-950/40 hover:bg-rose-900/60',
          border: 'border-rose-500/50',
          text: 'text-rose-400',
          activeBg: 'bg-rose-900/80 border-rose-400 ring-2 ring-rose-500/40',
        };
      case 'power':
        return {
          bg: 'bg-purple-950/40 hover:bg-purple-900/60',
          border: 'border-purple-500/50',
          text: 'text-purple-400',
          activeBg: 'bg-purple-900/80 border-purple-400 ring-2 ring-purple-500/40',
        };
      default:
        return {
          bg: 'bg-zinc-900',
          border: 'border-zinc-700',
          text: 'text-zinc-300',
          activeBg: 'bg-zinc-800',
        };
    }
  };

  return (
    <div
      id="silicon-die-floorplan-container"
      className="flex flex-col gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl"
    >
      {/* Floorplan Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold font-mono text-zinc-100">
              SILICON DIE MICROARCHITECTURE & FLOORPLAN
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              On-chip macro placement • Zero off-chip DRAM bus • {node.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-zinc-400">Total Area:</span>
            <span className="text-emerald-400 font-bold">{metrics.siliconAreaMm2} mm²</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="text-zinc-400">Gate Count:</span>
            <span className="text-sky-400 font-bold">~{metrics.totalGateCount.toLocaleString()} gates</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Die Canvas (Left) + Block Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Die Layout Physical Representation */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Silicon Die Substrate Outer Frame */}
          <div className="relative w-full max-w-[440px] aspect-square p-4 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black rounded-2xl border-4 border-zinc-700 shadow-2xl overflow-hidden">
            {/* Pad Ring Frame (Golden Bond Pads) */}
            <div className="absolute inset-0 pointer-events-none border-[12px] border-amber-900/30">
              {/* Top Pads */}
              <div className="absolute top-0 inset-x-0 flex justify-around px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-4 h-2 bg-amber-500/70 border border-amber-300/80 rounded-b-xs shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                ))}
              </div>
              {/* Bottom Pads */}
              <div className="absolute bottom-0 inset-x-0 flex justify-around px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-4 h-2 bg-amber-500/70 border border-amber-300/80 rounded-t-xs shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                ))}
              </div>
              {/* Left Pads */}
              <div className="absolute left-0 inset-y-0 flex flex-col justify-around py-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-2 h-4 bg-amber-500/70 border border-amber-300/80 rounded-r-xs shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                ))}
              </div>
              {/* Right Pads */}
              <div className="absolute right-0 inset-y-0 flex flex-col justify-around py-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-2 h-4 bg-amber-500/70 border border-amber-300/80 rounded-l-xs shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                ))}
              </div>
            </div>

            {/* Die Core Area */}
            <div className="relative w-full h-full p-2 bg-zinc-950/90 rounded-lg border border-zinc-800 overflow-hidden">
              {/* Microscopic silicon metal grid pattern */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />

              {/* Data Bus Lines (Visual Interconnect) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* SRAM to MAC Vector Bus */}
                <line
                  x1="24%"
                  y1="46%"
                  x2="24%"
                  y2="50%"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray={isBusy ? '4,4' : 'none'}
                  className={isBusy ? 'animate-pulse' : 'opacity-40'}
                />
                {/* ROM to MAC Vector Bus */}
                <line
                  x1="60%"
                  y1="46%"
                  x2="50%"
                  y2="50%"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray={isBusy ? '4,4' : 'none'}
                  className={isBusy ? 'animate-pulse' : 'opacity-40'}
                />
                {/* MAC to ReLU/Argmax Bus */}
                <line
                  x1="52%"
                  y1="65%"
                  x2="56%"
                  y2="65%"
                  stroke="#10b981"
                  strokeWidth="3"
                  className={isBusy ? 'animate-pulse' : 'opacity-40'}
                />
                {/* Argmax to LED Driver Bus */}
                <line
                  x1="74%"
                  y1="80%"
                  x2="74%"
                  y2="84%"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  className="opacity-70"
                />
              </svg>

              {/* Interactive Die Blocks */}
              {ASIC_DIE_BLOCKS.map((block) => {
                const colors = getCategoryColor(block.category);
                const isSelected = selectedBlockId === block.id;
                const isBlockActive =
                  isBusy &&
                  ((block.id === 'sram_input_buf' && activeFsmState.includes('L1')) ||
                    (block.id === 'weight_rom_macro' && activeFsmState.includes('COMPUTE')) ||
                    (block.id === 'mac_compute_engine' && activeFsmState.includes('COMPUTE')) ||
                    (block.id === 'activation_argmax' && activeFsmState.includes('ARGMAX')) ||
                    (block.id === 'led_output_driver' && activeFsmState.includes('LED')));

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setSelectedBlockId(block.id)}
                    style={{
                      left: `${block.x}%`,
                      top: `${block.y}%`,
                      width: `${block.width}%`,
                      height: `${block.height}%`,
                    }}
                    className={`absolute p-2 rounded-lg border flex flex-col justify-between text-left transition-all duration-150 cursor-pointer select-none ${
                      isSelected ? colors.activeBg : colors.bg + ' ' + colors.border
                    } ${isBlockActive ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold font-mono leading-tight ${colors.text}`}>
                          {block.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3 h-3 text-white shrink-0 ml-1" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 block mt-0.5">
                        {block.areaPct}% die area
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400 border-t border-white/10 pt-1">
                      <span>{block.gateCount} gates</span>
                      <span className="text-zinc-400">{block.transistorCount.toLocaleString()}T</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500/80" /> On-Chip Memory (SRAM/ROM)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" /> Compute / MAC Core
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/80" /> PMU & FSM Sequencer
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/80" /> LED Sink Drivers
            </span>
          </div>
        </div>

        {/* Selected Block Technical Dossier */}
        <div className="lg:col-span-5 flex flex-col gap-3 p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                MACRO BLOCK INSPECTOR
              </span>
              <h4 className="text-sm font-bold font-mono text-zinc-100">
                {selectedBlock.name}
              </h4>
            </div>
            <span className="text-xs font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
              {selectedBlock.category.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-zinc-300 font-mono leading-relaxed">
            {selectedBlock.description}
          </p>

          {/* Technical Specs Table */}
          <div className="space-y-1.5 font-mono text-xs border-t border-zinc-800/80 pt-2">
            <div className="flex justify-between text-zinc-400">
              <span>RTL Module:</span>
              <span className="text-sky-400 font-semibold flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                {selectedBlock.verilogRef}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Standard Gate Equivalents:</span>
              <span className="text-zinc-200">{selectedBlock.gateCount.toLocaleString()} NAND2</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Transistor Count:</span>
              <span className="text-zinc-200">{selectedBlock.transistorCount.toLocaleString()} FETs</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Die Area Share:</span>
              <span className="text-zinc-200">{selectedBlock.areaPct}%</span>
            </div>
          </div>

          {/* Block Specific Parameters */}
          <div className="p-3 bg-black/50 rounded-lg border border-zinc-800 font-mono text-[11px] space-y-1">
            <div className="text-zinc-400 font-semibold mb-1 text-[10px] uppercase">
              Silicon Hardware Specifications:
            </div>
            {Object.entries(selectedBlock.specs).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-zinc-400">{key}:</span>
                <span className="text-emerald-400 font-medium">{val}</span>
              </div>
            ))}
          </div>

          {/* Zero-DRAM Architectural Advantage Note */}
          {selectedBlock.id === 'sram_input_buf' || selectedBlock.id === 'weight_rom_macro' ? (
            <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] font-mono text-emerald-300 flex items-start gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Low-Power Advantage:</strong> Keeping both weights & image buffers on-chip avoids off-chip I/O capacitance (~20-50 pF), saving over 95% total energy compared to standard MCUs.
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
