export type ProcessNode = '180nm' | '65nm_lp' | '28nm_fdsoi';
export type LedColor = 'red' | 'green' | 'amber' | 'blue';
export type MacPrecision = 'INT4' | 'INT8';

export interface AsicConfig {
  vdd: number; // Volts (0.5V to 1.2V)
  clockFreqKhz: number; // kHz (10 kHz to 10,000 kHz)
  processNode: ProcessNode;
  macUnits: number; // 1, 4, 8, or 16 parallel MACs
  precision: MacPrecision;
  ledColor: LedColor;
  clockGatingEnabled: boolean;
  powerGatingSleep: boolean;
}

export interface PowerMetrics {
  dynamicPowerUw: number;
  leakagePowerUw: number;
  totalPowerUw: number;
  energyPerInferenceUj: number;
  latencyUs: number;
  throughputFps: number;
  siliconAreaMm2: number;
  totalGateCount: number;
  offChipBandwidthBytes: number; // 0! Because everything is integrated on-silicon
  sramPowerUw: number;
  romPowerUw: number;
  macPowerUw: number;
  pmuPowerUw: number;
  ledDriverPowerUw: number;
}

export type FsmState =
  | 'IDLE'
  | 'IMG_CAPTURE'
  | 'L1_COMPUTE'
  | 'L1_RELU'
  | 'L2_COMPUTE'
  | 'ARGMAX'
  | 'LED_DRIVE'
  | 'SLEEP';

export interface InferenceState {
  fsmState: FsmState;
  cycleCount: number;
  currentLayer: 1 | 2;
  currentNeuron: number;
  currentInputIdx: number;
  accumValue: number;
  activePixelValue: number;
  activeWeightValue: number;
  layer1Activations: number[]; // 24 hidden neurons
  layer2Logits: number[]; // 10 output classes
  probabilities: number[]; // 10 normalized confidences
  predictedDigit: number;
  confidence: number;
  isRecognizing: boolean;
  isClockStepping: boolean;
  sevenSegBits: {
    a: boolean;
    b: boolean;
    c: boolean;
    d: boolean;
    e: boolean;
    f: boolean;
    g: boolean;
    dp: boolean;
  };
}

export interface DieBlock {
  id: string;
  name: string;
  category: 'memory' | 'compute' | 'control' | 'power' | 'io';
  x: number; // percentage in die floorplan
  y: number;
  width: number;
  height: number;
  areaPct: number;
  gateCount: number;
  description: string;
  transistorCount: number;
  verilogRef: string;
  specs: { [key: string]: string };
}

export interface BenchmarkSample {
  digit: number;
  label: string;
  pixels: number[]; // 256 bytes (0-255)
}
