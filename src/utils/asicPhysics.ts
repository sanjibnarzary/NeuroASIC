/**
 * ASIC Physics, Power Estimation, and Floorplan Modeling
 * Equations based on standard CMOS scaling and near-threshold computing models:
 * P_dynamic = alpha * C_load * Vdd^2 * f_clk
 * P_leakage = I_leak * Vdd
 * Energy = P_total * t_inference
 */

import { AsicConfig, DieBlock, PowerMetrics } from '../types';

export interface ProcessNodeSpecs {
  name: string;
  nominalVdd: number;
  minVdd: number;
  maxVdd: number;
  lambdaUm: number; // Feature size
  capPerGateFf: number; // femtofarads per gate
  leakagePerGateNw: number; // nanoWatts leakage at nominal Vdd
  sramCellAreaUm2: number; // 6T SRAM cell size
  romCellAreaUm2: number; // 1T ROM cell size
  nand2AreaUm2: number; // 2-input NAND gate size
  description: string;
}

export const PROCESS_NODES: Record<string, ProcessNodeSpecs> = {
  '180nm': {
    name: '180nm Generic CMOS',
    nominalVdd: 1.8,
    minVdd: 0.9,
    maxVdd: 1.8,
    lambdaUm: 0.18,
    capPerGateFf: 3.5,
    leakagePerGateNw: 0.005, // very low leakage, but higher dynamic
    sramCellAreaUm2: 4.8,
    romCellAreaUm2: 0.8,
    nand2AreaUm2: 12.5,
    description: 'Mature, ultra-low mask cost planar CMOS node with virtually zero leakage current.',
  },
  '65nm_lp': {
    name: '65nm Low-Power (LP)',
    nominalVdd: 1.2,
    minVdd: 0.65,
    maxVdd: 1.2,
    lambdaUm: 0.065,
    capPerGateFf: 1.1,
    leakagePerGateNw: 0.08,
    sramCellAreaUm2: 0.52,
    romCellAreaUm2: 0.09,
    nand2AreaUm2: 2.1,
    description: 'Premier low-power edge AI node with high density and excellent near-threshold behavior.',
  },
  '28nm_fdsoi': {
    name: '28nm FD-SOI (Body Biasing)',
    nominalVdd: 0.8,
    minVdd: 0.5,
    maxVdd: 1.0,
    lambdaUm: 0.028,
    capPerGateFf: 0.5,
    leakagePerGateNw: 0.02,
    sramCellAreaUm2: 0.12,
    romCellAreaUm2: 0.025,
    nand2AreaUm2: 0.65,
    description: 'Ultra-low voltage planar FD-SOI with back-bias control, ideal for sub-milliwatt IoT neural chips.',
  },
};

/**
 * Silicon Die Floorplan Block Architecture:
 * Total Die Dimensions: ~1.2mm x 1.2mm in 65nm LP (or proportional)
 */
export const ASIC_DIE_BLOCKS: DieBlock[] = [
  {
    id: 'sram_input_buf',
    name: 'On-Chip Image Buffer SRAM',
    category: 'memory',
    x: 8,
    y: 8,
    width: 32,
    height: 38,
    areaPct: 15,
    gateCount: 1950,
    transistorCount: 12288,
    verilogRef: 'input_image_buffer.v',
    description: 'Dual-port synchronous SRAM array (256 bytes x 8-bit). Holds captured 16x16 grayscale frame on-silicon, completely eliminating external memory bus traffic.',
    specs: {
      Capacity: '2,048 bits (256 bytes)',
      Ports: '1R / 1W Dual Port Synchronous',
      AccessTime: '0.82 ns',
      'Leakage State': 'Retention-ready sleep gating',
    },
  },
  {
    id: 'weight_rom_macro',
    name: 'Pretrained Weight NVM / ROM',
    category: 'memory',
    x: 44,
    y: 8,
    width: 48,
    height: 38,
    areaPct: 22,
    gateCount: 3800,
    transistorCount: 51072,
    verilogRef: 'pretrained_weight_rom.v',
    description: 'High-density metal diffusion ROM / eFlash hard macro containing all 6,384 INT8 pretrained weights and biases. Directly coupled to MAC bitlines with zero off-chip pin crossings.',
    specs: {
      Capacity: '6.4 Kilobytes (6,384 x 8-bit)',
      Architecture: 'Direct-mapped hard macro array',
      'Energy / Bit': '0.04 pJ / bit access',
      Retention: '> 20 years non-volatile',
    },
  },
  {
    id: 'mac_compute_engine',
    name: 'Quantized INT8 MAC Vector Array',
    category: 'compute',
    x: 8,
    y: 50,
    width: 44,
    height: 30,
    areaPct: 24,
    gateCount: 5200,
    transistorCount: 31200,
    verilogRef: 'quantized_mac_core.v',
    description: 'Pipelined fixed-point Multiply-Accumulate units with Booth radix-4 multipliers and 24-bit saturation accumulators. Features fine-grained operand isolation for zero-switching on inactive pixels.',
    specs: {
      Precision: 'INT8 x INT8 with 24-bit Accumulator',
      Throughput: '1 MAC / cycle per PE',
      'Power Optimization': 'Operand isolation & zero-skipping',
      Architecture: 'Configurable parallel PEs (1 to 16)',
    },
  },
  {
    id: 'activation_argmax',
    name: 'ReLU Activation & Argmax Unit',
    category: 'compute',
    x: 56,
    y: 50,
    width: 36,
    height: 30,
    areaPct: 14,
    gateCount: 1600,
    transistorCount: 9600,
    verilogRef: 'argmax_comparator.v',
    description: 'Hardware ReLU clamp unit (single cycle sign-bit multiplexer) and parallel 10-way tree comparator that latches winning class index and confidence margin.',
    specs: {
      Activation: 'Zero-cycle clamp ReLU(x) = max(0, x)',
      Comparator: '10-input tournament tree',
      Output: '4-bit BCD digit (0-9) + 8-bit score',
    },
  },
  {
    id: 'fsm_control_pmu',
    name: 'FSM Sequencer & Clock Gater (PMU)',
    category: 'control',
    x: 8,
    y: 84,
    width: 36,
    height: 12,
    areaPct: 11,
    gateCount: 1250,
    transistorCount: 7500,
    verilogRef: 'pmu_clock_gater.v',
    description: 'Finite State Machine controller and Integrated Clock Gating (ICG) cells. Shuts down clock distribution to idle memory banks and MAC units during inference steps.',
    specs: {
      States: 'IDLE, SENSE, L1_MAC, L2_MAC, ARGMAX, SLEEP',
      ClockGating: 'Cell-level dynamic latch enable',
      Wakeup: 'Single clock edge latency (<100ns)',
    },
  },
  {
    id: 'led_output_driver',
    name: 'BCD 7-Segment & LED Drivers',
    category: 'io',
    x: 48,
    y: 84,
    width: 44,
    height: 12,
    areaPct: 14,
    gateCount: 850,
    transistorCount: 5100,
    verilogRef: 'led_seven_segment_driver.v',
    description: 'Integrated BCD-to-7-segment hardware decoder with 8x constant-current low-drop sink drivers capable of directly driving common-cathode LED displays without external resistors.',
    specs: {
      Channels: '8 pins (Segments A-G + DP) + 10x Bargraph',
      CurrentPerPin: '2 mA to 10 mA software/pin programmable',
      DriveMode: 'Constant Current Sink CMOS',
      Decoder: 'Combinational ROM LUT (<1.2 ns)',
    },
  },
];

/**
 * Calculate power, energy, latency, and area for given ASIC configuration
 */
export function calculateAsicPowerMetrics(config: AsicConfig): PowerMetrics {
  const node = PROCESS_NODES[config.processNode] || PROCESS_NODES['65nm_lp'];
  const vdd = config.vdd;
  const fKhz = config.clockFreqKhz;
  const fHz = fKhz * 1000;

  // Gate counts
  const totalGates = ASIC_DIE_BLOCKS.reduce((sum, b) => sum + b.gateCount, 0);

  // Switching activity factor alpha (clock gating reduces from ~0.25 to ~0.08)
  const alpha = config.clockGatingEnabled ? 0.075 : 0.24;

  // Effective capacitance = Gates * C_per_gate
  const totalCeffFarads = totalGates * (node.capPerGateFf * 1e-15);

  // Dynamic power: P = alpha * C * Vdd^2 * f
  let dynamicPowerWatts = alpha * totalCeffFarads * Math.pow(vdd, 2) * fHz;

  // Leakage power: I_leak * Vdd
  // Leakage scales exponentially with Vdd: I_leak ~ I0 * exp(Vdd / (S * log(10)))
  const vddRatio = vdd / node.nominalVdd;
  const leakageScaling = Math.exp(1.8 * (vddRatio - 1));
  let leakagePowerWatts = totalGates * (node.leakagePerGateNw * 1e-9) * leakageScaling * (vdd / node.nominalVdd);

  if (config.powerGatingSleep) {
    // In deep sleep, MTCMOS power switch isolates core logic: leakage drops by 98%
    dynamicPowerWatts = 0;
    leakagePowerWatts *= 0.02;
  }

  const dynamicPowerUw = dynamicPowerWatts * 1e6;
  const leakagePowerUw = leakagePowerWatts * 1e6;
  const totalPowerUw = dynamicPowerUw + leakagePowerUw;

  // Cycle estimation:
  // Layer 1 MACs: 256 inputs * 24 neurons = 6,144 MAC operations
  // Layer 2 MACs: 24 inputs * 10 neurons = 240 MAC operations
  // Total MACs = 6,384 MACs
  // With N parallel MAC units: (6,384 / N) + overhead (e.g. 50 cycles for FSM & Argmax)
  const macCycles = Math.ceil(6384 / config.macUnits);
  const totalCycles = macCycles + 48; // Capture + ReLU + Argmax + Output latch

  // Latency in microseconds: cycles / fKhz * 1000
  const latencyUs = (totalCycles / fKhz) * 1000;
  const throughputFps = Math.min(100000, Math.round(1e6 / Math.max(1, latencyUs)));

  // Energy per inference: Total Power (W) * Latency (s)
  const energyPerInferenceJoules = (totalPowerWatts(dynamicPowerWatts, leakagePowerWatts)) * (latencyUs * 1e-6);
  const energyPerInferenceUj = energyPerInferenceJoules * 1e6;

  // Silicon Area calculation:
  // SRAM 256B: 2048 bits * sramCellAreaUm2
  // ROM 6.4KB: 6384 * 8 bits * romCellAreaUm2
  // Logic: gates * nand2AreaUm2
  // Routing overhead: 1.4x factor
  const sramAreaUm2 = 2048 * node.sramCellAreaUm2;
  const romAreaUm2 = 6384 * 8 * node.romCellAreaUm2;
  const logicAreaUm2 = totalGates * node.nand2AreaUm2;
  const totalAreaUm2 = (sramAreaUm2 + romAreaUm2 + logicAreaUm2) * 1.45;
  const siliconAreaMm2 = totalAreaUm2 / 1e6;

  // Component power breakdown in uW
  const sramPowerUw = dynamicPowerUw * 0.18 + leakagePowerUw * 0.15;
  const romPowerUw = dynamicPowerUw * 0.12 + leakagePowerUw * 0.05;
  const macPowerUw = dynamicPowerUw * 0.52 + leakagePowerUw * 0.45;
  const pmuPowerUw = dynamicPowerUw * 0.08 + leakagePowerUw * 0.15;
  const ledDriverPowerUw = dynamicPowerUw * 0.10 + leakagePowerUw * 0.20;

  return {
    dynamicPowerUw: Math.max(0.1, Number(dynamicPowerUw.toFixed(2))),
    leakagePowerUw: Math.max(0.01, Number(leakagePowerUw.toFixed(2))),
    totalPowerUw: Math.max(0.1, Number(totalPowerUw.toFixed(2))),
    energyPerInferenceUj: Math.max(0.001, Number(energyPerInferenceUj.toFixed(3))),
    latencyUs: Math.max(0.1, Number(latencyUs.toFixed(1))),
    throughputFps,
    siliconAreaMm2: Number(siliconAreaMm2.toFixed(4)),
    totalGateCount: totalGates,
    offChipBandwidthBytes: 0, // Zero DRAM access!
    sramPowerUw: Number(sramPowerUw.toFixed(2)),
    romPowerUw: Number(romPowerUw.toFixed(2)),
    macPowerUw: Number(macPowerUw.toFixed(2)),
    pmuPowerUw: Number(pmuPowerUw.toFixed(2)),
    ledDriverPowerUw: Number(ledDriverPowerUw.toFixed(2)),
  };
}

function totalPowerWatts(dyn: number, leak: number): number {
  return dyn + leak;
}
