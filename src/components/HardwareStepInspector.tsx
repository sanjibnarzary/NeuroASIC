import React from 'react';
import { FsmState, InferenceState } from '../types';
import { Play, SkipForward, RotateCcw, Cpu, Binary } from 'lucide-react';

interface HardwareStepInspectorProps {
  state: InferenceState;
  onStepClock: () => void;
  onStepLayer: () => void;
  onReset: () => void;
  onRunContinuous: () => void;
}

const FSM_STEPS: { state: FsmState; label: string; desc: string }[] = [
  { state: 'IDLE', label: 'IDLE', desc: 'Awaiting start strobe' },
  { state: 'IMG_CAPTURE', label: 'LATCH_IMG', desc: 'Latching 16x16 frame into SRAM' },
  { state: 'L1_COMPUTE', label: 'L1_MAC', desc: 'Accumulating 256x24 INT8 weights' },
  { state: 'L1_RELU', label: 'L1_RELU', desc: 'Clamping ReLU max(0, x)' },
  { state: 'L2_COMPUTE', label: 'L2_MAC', desc: 'Computing 24x10 output logits' },
  { state: 'ARGMAX', label: 'ARGMAX', desc: '10-way comparator tournament' },
  { state: 'LED_DRIVE', label: 'LED_OUT', desc: 'Latch BCD to 7-Segment drivers' },
  { state: 'SLEEP', label: 'SLEEP', desc: 'ICG clock-gated power retention' },
];

export const HardwareStepInspector: React.FC<HardwareStepInspectorProps> = ({
  state,
  onStepClock,
  onStepLayer,
  onReset,
  onRunContinuous,
}) => {
  const currentFsmIndex = FSM_STEPS.findIndex((s) => s.state === state.fsmState);

  return (
    <div
      id="asic-hardware-step-inspector"
      className="flex flex-col gap-4 p-5 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl font-mono"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              CYCLE-ACCURATE RTL EXECUTION INSPECTOR
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Live hardware register monitoring • Synchronous clock step
            </p>
          </div>
        </div>

        {/* Execution Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Core
          </button>
          <button
            type="button"
            onClick={onStepClock}
            className="flex items-center gap-1.5 text-xs bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 px-3 py-1.5 rounded-lg transition font-semibold"
          >
            <SkipForward className="w-3.5 h-3.5" /> CLK Tick
          </button>
          <button
            type="button"
            onClick={onStepLayer}
            className="flex items-center gap-1.5 text-xs bg-sky-950/80 hover:bg-sky-900 border border-sky-500/60 text-sky-300 px-3 py-1.5 rounded-lg transition font-semibold"
          >
            <SkipForward className="w-3.5 h-3.5" /> Step Layer
          </button>
          <button
            type="button"
            onClick={onRunContinuous}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-black px-3.5 py-1.5 rounded-lg transition font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          >
            <Play className="w-3.5 h-3.5" /> Run Free
          </button>
        </div>
      </div>

      {/* FSM State Pipeline Ribbon */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-zinc-400 font-semibold">
          FSM CONTROLLER STATE PIPELINE:
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {FSM_STEPS.map((step, idx) => {
            const isActive = step.state === state.fsmState;
            const isPassed = currentFsmIndex > idx;

            return (
              <div
                key={step.state}
                className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                  isActive
                    ? 'bg-emerald-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400'
                    : isPassed
                    ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 opacity-60'
                }`}
              >
                <span
                  className={`text-[10px] font-bold ${
                    isActive ? 'text-emerald-300' : 'text-zinc-300'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[8px] text-zinc-400 mt-0.5 leading-none">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Silicon Register File & Data Bus Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Memory Interface Bus */}
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-1.5 font-bold">
            <span className="flex items-center gap-1.5 text-blue-400">
              <Binary className="w-3.5 h-3.5" /> ON-CHIP MEMORY BUS
            </span>
            <span className="text-[10px]">PORTS A/B</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">SRAM Read Addr:</span>
            <span className="text-zinc-100 font-bold">
              0x{state.currentInputIdx.toString(16).padStart(2, '0').toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">SRAM Data Out:</span>
            <span className="text-blue-400 font-bold">
              {state.activePixelValue} (0x{state.activePixelValue.toString(16).padStart(2, '0')})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Weight ROM Addr:</span>
            <span className="text-zinc-100 font-bold">
              0x{((state.currentInputIdx * 24) + state.currentNeuron).toString(16).padStart(4, '0').toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Weight Data (INT8):</span>
            <span className="text-emerald-400 font-bold">
              {state.activeWeightValue}
            </span>
          </div>
        </div>

        {/* Compute Arithmetic Registers */}
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-1.5 font-bold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Binary className="w-3.5 h-3.5" /> QUANTIZED MAC ENGINE
            </span>
            <span className="text-[10px]">24-BIT ACCUM</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Active Layer:</span>
            <span className="text-zinc-100 font-bold">
              Layer {state.currentLayer} ({state.currentLayer === 1 ? '256→24' : '24→10'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Target Neuron:</span>
            <span className="text-zinc-100 font-bold">
              #{state.currentNeuron}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">MAC Accumulator:</span>
            <span className="text-amber-400 font-bold">
              {state.accumValue}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Activation Unit:</span>
            <span className="text-emerald-400 font-bold">
              {state.currentLayer === 1 ? 'ReLU: max(0, x)' : 'Linear Argmax'}
            </span>
          </div>
        </div>

        {/* Output & Display Bus */}
        <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-800 pb-1.5 font-bold">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Binary className="w-3.5 h-3.5" /> LED DRIVER REGISTERS
            </span>
            <span className="text-[10px]">BCD LATCH</span>
          </div>

          <div className="flex justify-between">
            <span className="text-zinc-400">Argmax Winner Reg:</span>
            <span className="text-rose-400 font-bold text-sm">
              Digit [{state.predictedDigit}]
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Margin Confidence:</span>
            <span className="text-zinc-100 font-bold">
              {(state.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">BCD Pin Bus:</span>
            <span className="text-zinc-300 font-bold">
              4'b{state.predictedDigit.toString(2).padStart(4, '0')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Total Clock Cycles:</span>
            <span className="text-sky-400 font-bold">
              {state.cycleCount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
