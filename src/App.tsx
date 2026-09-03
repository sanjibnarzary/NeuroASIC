import React, { useState, useEffect, useCallback } from 'react';
import {
  AsicConfig,
  FsmState,
  InferenceState,
  LedColor,
} from './types';
import {
  BENCHMARK_SAMPLES,
  BLANK_SEVEN_SEG,
  runAsicInference,
} from './utils/modelWeights';
import { calculateAsicPowerMetrics } from './utils/asicPhysics';
import { SevenSegmentDisplay } from './components/SevenSegmentDisplay';
import { LedBarArray } from './components/LedBarArray';
import { DrawingInputBuffer } from './components/DrawingInputBuffer';
import { SiliconDieFloorplan } from './components/SiliconDieFloorplan';
import { PowerTelemetryPanel } from './components/PowerTelemetryPanel';
import { HardwareStepInspector } from './components/HardwareStepInspector';
import { VerilogCodeViewer } from './components/VerilogCodeViewer';
import {
  Cpu,
  Layers,
  Zap,
  Activity,
  FileCode,
  Radio,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'bench' | 'floorplan' | 'stepper' | 'verilog'>('bench');

  // ASIC Hardware Configuration State
  const [config, setConfig] = useState<AsicConfig>({
    vdd: 0.8, // 800mV Near-threshold default
    clockFreqKhz: 500, // 500 kHz default (low power)
    processNode: '65nm_lp',
    macUnits: 8,
    precision: 'INT8',
    ledColor: 'red',
    clockGatingEnabled: true,
    powerGatingSleep: false,
  });

  // Current on-chip SRAM pixels (256 bytes) initialized with MNIST Digit 7
  const [pixels, setPixels] = useState<number[]>(() => {
    return [...BENCHMARK_SAMPLES[7].pixels];
  });

  // Inference Execution State
  const [inferenceState, setInferenceState] = useState<InferenceState>(() => {
    const initialResult = runAsicInference(BENCHMARK_SAMPLES[7].pixels);
    return {
      fsmState: 'LED_DRIVE',
      cycleCount: 846,
      currentLayer: 2,
      currentNeuron: 7,
      currentInputIdx: 23,
      accumValue: 1420,
      activePixelValue: 245,
      activeWeightValue: 38,
      layer1Activations: initialResult.layer1Activations,
      layer2Logits: initialResult.layer2Logits,
      probabilities: initialResult.probabilities,
      predictedDigit: initialResult.predictedDigit,
      confidence: initialResult.confidence,
      isRecognizing: false,
      isClockStepping: false,
      sevenSegBits: initialResult.sevenSegBits,
    };
  });

  // Power metrics calculated based on current config
  const metrics = calculateAsicPowerMetrics(config);

  // Trigger inference whenever pixels change
  const triggerInference = useCallback(
    (newPixels: number[]) => {
      if (config.powerGatingSleep) return;

      const result = runAsicInference(newPixels);

      setInferenceState((prev) => ({
        ...prev,
        fsmState: 'LED_DRIVE',
        cycleCount: prev.cycleCount + Math.ceil(6384 / config.macUnits),
        currentLayer: 2,
        currentNeuron: result.predictedDigit,
        currentInputIdx: 255,
        accumValue: result.layer2Logits[result.predictedDigit] * 64,
        activePixelValue: newPixels[128] || 0,
        activeWeightValue: 32,
        layer1Activations: result.layer1Activations,
        layer2Logits: result.layer2Logits,
        probabilities: result.probabilities,
        predictedDigit: result.predictedDigit,
        confidence: result.confidence,
        isRecognizing: false,
        sevenSegBits: result.sevenSegBits,
      }));
    },
    [config.powerGatingSleep, config.macUnits]
  );

  const handlePixelChange = (newPixels: number[]) => {
    setPixels(newPixels);
    triggerInference(newPixels);
  };

  const handleSelectBenchmark = (digit: number) => {
    const sample = BENCHMARK_SAMPLES.find((s) => s.digit === digit);
    if (sample) {
      handlePixelChange([...sample.pixels]);
    }
  };

  const handleConfigChange = (newConfig: Partial<AsicConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Clock Stepper Functions
  const handleStepClock = () => {
    setInferenceState((prev) => {
      let nextState: FsmState = prev.fsmState;
      let nextLayer: 1 | 2 = prev.currentLayer;
      let nextNeuron = prev.currentNeuron;
      let nextInputIdx = prev.currentInputIdx + 1;
      let nextAccum = prev.accumValue;

      if (prev.fsmState === 'IDLE') {
        nextState = 'IMG_CAPTURE';
        nextInputIdx = 0;
      } else if (prev.fsmState === 'IMG_CAPTURE') {
        nextState = 'L1_COMPUTE';
        nextLayer = 1;
        nextNeuron = 0;
        nextInputIdx = 0;
      } else if (prev.fsmState === 'L1_COMPUTE') {
        if (nextInputIdx >= 256) {
          nextInputIdx = 0;
          nextNeuron += 1;
          if (nextNeuron >= 24) {
            nextState = 'L1_RELU';
          }
        }
        const pix = pixels[nextInputIdx] || 0;
        nextAccum += pix * 8;
      } else if (prev.fsmState === 'L1_RELU') {
        nextState = 'L2_COMPUTE';
        nextLayer = 2;
        nextNeuron = 0;
        nextInputIdx = 0;
      } else if (prev.fsmState === 'L2_COMPUTE') {
        nextState = 'ARGMAX';
      } else if (prev.fsmState === 'ARGMAX') {
        nextState = 'LED_DRIVE';
      } else {
        nextState = 'IDLE';
      }

      return {
        ...prev,
        fsmState: nextState,
        cycleCount: prev.cycleCount + 1,
        currentLayer: nextLayer,
        currentNeuron: nextNeuron % 24,
        currentInputIdx: nextInputIdx % 256,
        accumValue: nextAccum,
        activePixelValue: pixels[nextInputIdx % 256] || 0,
      };
    });
  };

  const handleStepLayer = () => {
    setInferenceState((prev) => {
      const nextLayer = prev.currentLayer === 1 ? 2 : 1;
      return {
        ...prev,
        currentLayer: nextLayer,
        fsmState: nextLayer === 2 ? 'L2_COMPUTE' : 'L1_COMPUTE',
        cycleCount: prev.cycleCount + (nextLayer === 1 ? 256 : 24),
      };
    });
  };

  const handleResetCore = () => {
    setInferenceState((prev) => ({
      ...prev,
      fsmState: 'IDLE',
      cycleCount: 0,
      currentLayer: 1,
      currentNeuron: 0,
      currentInputIdx: 0,
      accumValue: 0,
      sevenSegBits: BLANK_SEVEN_SEG,
    }));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Engineering Nav & Chip Status Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Chip Identifier */}
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-[0_0_16px_rgba(16,185,129,0.3)]">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold font-mono tracking-tight text-white">
                  NeuroASIC-10D
                </h1>
                <span className="text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  SILICON TAPE-OUT READY
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Dedicated Neural ASIC • On-Chip SRAM Buffer • Pretrained ROM • LED Interface
              </p>
            </div>
          </div>

          {/* Quick Hardware Status Tags */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-zinc-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>DRAM Traffic:</span>
              <span className="text-emerald-400 font-bold">0 B/s (100% On-Chip)</span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Core Power:</span>
              <span className="text-amber-400 font-bold">
                {metrics.totalPowerUw < 1000
                  ? `${metrics.totalPowerUw} µW`
                  : `${(metrics.totalPowerUw / 1000).toFixed(2)} mW`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Energy:</span>
              <span className="text-sky-400 font-bold">
                {metrics.energyPerInferenceUj} µJ/inf
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto text-xs font-mono border-t border-zinc-900 pt-1 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('bench')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'bench'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Live Chip System & LED Output
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('floorplan')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'floorplan'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Silicon Die Floorplan & Microarchitecture
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stepper')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'stepper'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Cycle-Accurate RTL Stepper
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verilog')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'verilog'
                ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-rose-400" />
            Synthesizable Verilog & Pinout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {activeTab === 'bench' && (
          <div className="space-y-6">
            {/* Top Interactive System Row: Drawing Pad (Left) + Physical 7-Segment LED (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Drawing Pad & SRAM Image Buffer */}
              <div className="lg:col-span-7">
                <DrawingInputBuffer
                  pixels={pixels}
                  onPixelChange={handlePixelChange}
                  onSelectBenchmark={handleSelectBenchmark}
                  isRecognizing={inferenceState.isRecognizing}
                />
              </div>

              {/* Right Column: Physical 7-Segment LED Unit & Decoded Result */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <SevenSegmentDisplay
                  segments={inferenceState.sevenSegBits}
                  color={config.ledColor}
                  digitValue={inferenceState.predictedDigit}
                  confidence={inferenceState.confidence}
                  active={!config.powerGatingSleep}
                  size="lg"
                />
              </div>
            </div>

            {/* Discrete 10-Channel LED Annunciator Bar & Chip Status Pins */}
            <LedBarArray
              probabilities={inferenceState.probabilities}
              predictedDigit={inferenceState.predictedDigit}
              color={config.ledColor}
              isBusy={inferenceState.isRecognizing}
              isValid={!config.powerGatingSleep}
              isSleep={config.powerGatingSleep}
              clockFreqKhz={config.clockFreqKhz}
            />

            {/* Power Telemetry & Voltage / Frequency Scaling Panel */}
            <PowerTelemetryPanel
              config={config}
              metrics={metrics}
              onConfigChange={handleConfigChange}
            />
          </div>
        )}

        {activeTab === 'floorplan' && (
          <div className="space-y-6">
            <SiliconDieFloorplan
              config={config}
              metrics={metrics}
              isBusy={inferenceState.isRecognizing}
              activeFsmState={inferenceState.fsmState}
            />

            <PowerTelemetryPanel
              config={config}
              metrics={metrics}
              onConfigChange={handleConfigChange}
            />
          </div>
        )}

        {activeTab === 'stepper' && (
          <div className="space-y-6">
            <HardwareStepInspector
              state={inferenceState}
              onStepClock={handleStepClock}
              onStepLayer={handleStepLayer}
              onReset={handleResetCore}
              onRunContinuous={() => triggerInference(pixels)}
            />

            {/* Compact Drawing Input & LED Display Preview for Stepping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DrawingInputBuffer
                pixels={pixels}
                onPixelChange={handlePixelChange}
                onSelectBenchmark={handleSelectBenchmark}
                isRecognizing={inferenceState.isRecognizing}
              />
              <SevenSegmentDisplay
                segments={inferenceState.sevenSegBits}
                color={config.ledColor}
                digitValue={inferenceState.predictedDigit}
                confidence={inferenceState.confidence}
                active={!config.powerGatingSleep}
                size="md"
              />
            </div>
          </div>
        )}

        {activeTab === 'verilog' && (
          <div className="space-y-6">
            <VerilogCodeViewer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 px-4 text-center text-xs font-mono text-zinc-400">
        NeuroASIC • Application-Specific Integrated Circuit for Edge Neural Digit Recognition • Low-Power Sub-Milliwatt Silicon Architecture
      </footer>
    </div>
  );
}
