import React, { useState } from 'react';
import { VERILOG_MODULES } from '../utils/verilogRtl';
import { FileCode, Copy, Check, Download, Box, Cpu } from 'lucide-react';

export const VerilogCodeViewer: React.FC = () => {
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeModule = VERILOG_MODULES[activeModuleIdx] || VERILOG_MODULES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeModule.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeModule.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeModule.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="verilog-rtl-container"
      className="flex flex-col gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl font-mono"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              SYNTHESIZABLE VERILOG RTL & SILICON PACKAGE
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Ready for Synopsys Design Compiler / Cadence Genus ASIC tapeout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy RTL'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600/50 px-3 py-1.5 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" /> Download .v
          </button>
        </div>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-800/80">
        {VERILOG_MODULES.map((mod, idx) => (
          <button
            key={mod.filename}
            type="button"
            onClick={() => setActiveModuleIdx(idx)}
            className={`px-3 py-1.5 rounded-lg text-xs transition shrink-0 flex items-center gap-1.5 ${
              activeModuleIdx === idx
                ? 'bg-sky-950/80 text-sky-300 border border-sky-500/60 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            {mod.filename}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
        <span className="text-sky-400 font-bold mr-2">MODULE SPECS:</span>
        {activeModule.description}
      </div>

      {/* Verilog Source Code Display */}
      <div className="relative rounded-xl border border-zinc-800 bg-black/90 p-4 max-h-96 overflow-y-auto text-xs text-zinc-300 leading-relaxed font-mono select-all">
        <pre>{activeModule.code}</pre>
      </div>

      {/* Physical Chip Package View (QFN-32) */}
      <div className="p-4 bg-zinc-900/40 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
          <Box className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-zinc-200">
            CHIP PACKAGE & PINOUT (5x5mm QFN-32 PLASTIC ENCAPSULATION)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 bg-black/50 rounded-lg border border-zinc-800/80 space-y-1">
            <span className="text-amber-400 font-bold block mb-1">Power & Clocks (Pins 1-8)</span>
            <div>Pin 1: <span className="text-zinc-200">VDD (0.5V - 1.2V Core)</span></div>
            <div>Pin 2: <span className="text-zinc-200">VDDIO (3.3V Pad Ring)</span></div>
            <div>Pin 3: <span className="text-zinc-200">VSS (Ground Return)</span></div>
            <div>Pin 4: <span className="text-zinc-200">CLK_IN (System Clock)</span></div>
            <div>Pin 5: <span className="text-zinc-200">RST_N (Active-Low Async)</span></div>
            <div>Pin 6: <span className="text-zinc-200">START_INFER (Capture Trigger)</span></div>
            <div>Pin 7: <span className="text-zinc-200">SLEEP_EN (Power Gate Cut)</span></div>
            <div>Pin 8: <span className="text-zinc-200">INFER_BUSY (Status)</span></div>
          </div>

          <div className="p-2.5 bg-black/50 rounded-lg border border-zinc-800/80 space-y-1">
            <span className="text-sky-400 font-bold block mb-1">Sensor SRAM Bus (Pins 9-20)</span>
            <div>Pins 9-16: <span className="text-zinc-200">PIXEL_DATA[7:0]</span></div>
            <div>Pins 17-20: <span className="text-zinc-200">PIXEL_ADDR_HI[3:0]</span></div>
            <div>Pin 21: <span className="text-zinc-200">PIXEL_WE (Write Strobe)</span></div>
            <div>Pin 22: <span className="text-zinc-200">INFER_VALID (Valid Flag)</span></div>
            <div>Pin 23: <span className="text-zinc-200">LED_DP (Decimal Point)</span></div>
            <div>Pin 24: <span className="text-zinc-200">THERMAL_SENSE</span></div>
          </div>

          <div className="p-2.5 bg-black/50 rounded-lg border border-zinc-800/80 space-y-1">
            <span className="text-rose-400 font-bold block mb-1">LED Direct Sink (Pins 25-32)</span>
            <div>Pin 25: <span className="text-zinc-200">SEG_A (Top Horiz)</span></div>
            <div>Pin 26: <span className="text-zinc-200">SEG_B (Top Right Vert)</span></div>
            <div>Pin 27: <span className="text-zinc-200">SEG_C (Bot Right Vert)</span></div>
            <div>Pin 28: <span className="text-zinc-200">SEG_D (Bot Horiz)</span></div>
            <div>Pin 29: <span className="text-zinc-200">SEG_E (Bot Left Vert)</span></div>
            <div>Pin 30: <span className="text-zinc-200">SEG_F (Top Left Vert)</span></div>
            <div>Pin 31: <span className="text-zinc-200">SEG_G (Center Horiz)</span></div>
            <div>Pin 32: <span className="text-zinc-200">EXPOSED_DIE_PAD (GND)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
