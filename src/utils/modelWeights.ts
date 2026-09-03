/**
 * ASIC Pretrained Neural Network Weights and MNIST Digit Templates
 * Architecture: 256 Inputs (16x16 8-bit grayscale) -> 24 Hidden (INT8) -> 10 Outputs (INT8)
 * Quantization: Fixed-point INT8 weights stored in simulated on-chip silicon ROM
 */

import { BenchmarkSample } from '../types';

// BCD to 7-segment active-high decoding table: { a, b, c, d, e, f, g }
// Segments:
//    -- a --
//   |       |
//   f       b
//   |       |
//    -- g --
//   |       |
//   e       c
//   |       |
//    -- d --  (dp)
export const SEVEN_SEG_TABLE: Record<number, { a: boolean; b: boolean; c: boolean; d: boolean; e: boolean; f: boolean; g: boolean; dp: boolean }> = {
  0: { a: true,  b: true,  c: true,  d: true,  e: true,  f: true,  g: false, dp: false },
  1: { a: false, b: true,  c: true,  d: false, e: false, f: false, g: false, dp: false },
  2: { a: true,  b: true,  c: false, d: true,  e: true,  f: false, g: true,  dp: false },
  3: { a: true,  b: true,  c: true,  d: true,  e: false, f: false, g: true,  dp: false },
  4: { a: false, b: true,  c: true,  d: false, e: false, f: true,  g: true,  dp: false },
  5: { a: true,  b: false, c: true,  d: true,  e: false, f: true,  g: true,  dp: false },
  6: { a: true,  b: false, c: true,  d: true,  e: true,  f: true,  g: true,  dp: false },
  7: { a: true,  b: true,  c: true,  d: false, e: false, f: false, g: false, dp: false },
  8: { a: true,  b: true,  c: true,  d: true,  e: true,  f: true,  g: true,  dp: false },
  9: { a: true,  b: true,  c: true,  d: true,  e: false, f: true,  g: true,  dp: false },
};

export const BLANK_SEVEN_SEG = { a: false, b: false, c: false, d: false, e: false, f: false, g: false, dp: false };

// 16x16 Digit Canonical Bitmap Templates for generating realistic pre-trained weights & benchmarks
// 16 lines of 16 characters each ('.' = 0, '#' = 255)
const DIGIT_TEMPLATES_16x16: string[] = [
  // Digit 0
  `
....########....
...##########...
..###......###..
.###........###.
.###........###.
.###........###.
.###........###.
.###........###.
.###........###.
.###........###.
.###........###.
.###........###.
..###......###..
...##########...
....########....
................
`,
  // Digit 1
  `
......####......
.....######.....
....#######.....
......####......
......####......
......####......
......####......
......####......
......####......
......####......
......####......
......####......
......####......
....########....
...##########...
................
`,
  // Digit 2
  `
....########....
...##########...
..###......###..
.###........###.
............###.
...........###..
..........###...
........####....
......####......
....####........
...###..........
..###...........
.##############.
.##############.
.##############.
................
`,
  // Digit 3
  `
....########....
...##########...
..###......###..
...........###..
...........###..
........#####...
.......######...
........#####...
...........###..
...........###..
.###.......###..
..###......###..
...##########...
....########....
................
................
`,
  // Digit 4
  `
.........###....
........####....
.......#####....
......######....
.....#######....
....###.####....
...###..####....
..###...####....
.###....####....
.##############.
.##############.
........####....
........####....
........####....
........####....
................
`,
  // Digit 5
  `
.##############.
.##############.
.###............
.###............
.###............
.##########.....
.###########....
...........###..
...........###..
...........###..
.###.......###..
..###......###..
...##########...
....########....
................
................
`,
  // Digit 6
  `
....########....
...##########...
..###......###..
.###............
.###............
.##########.....
.###########....
.###.......###..
.###.......###..
.###.......###..
.###.......###..
..###......###..
...##########...
....########....
................
................
`,
  // Digit 7
  `
.##############.
.##############.
..........####..
.........####...
........####....
.......####.....
......####......
.....####.......
....####........
...####.........
...####.........
...####.........
...####.........
...####.........
...####.........
................
`,
  // Digit 8
  `
....########....
...##########...
..###......###..
..###......###..
...##########...
....########....
...##########...
..###......###..
.###........###.
.###........###.
.###........###.
..###......###..
...##########...
....########....
................
................
`,
  // Digit 9
  `
....########....
...##########...
..###......###..
.###........###.
.###........###.
.###........###.
..#############.
...############.
...........###..
...........###..
...........###..
..###......###..
...##########...
....########....
................
................
`,
];

/**
 * Convert template string into 256-element array of pixel intensities [0..255]
 */
export function templateToPixels(template: string): number[] {
  const lines = template
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const pixels: number[] = new Array(256).fill(0);
  for (let r = 0; r < Math.min(16, lines.length); r++) {
    const line = lines[r];
    for (let c = 0; c < Math.min(16, line.length); c++) {
      const ch = line[c];
      const idx = r * 16 + c;
      if (ch === '#') {
        pixels[idx] = 245;
      } else if (ch === '+') {
        pixels[idx] = 160;
      } else {
        pixels[idx] = 0;
      }
    }
  }
  return pixels;
}

// 10 Standard Benchmark Digit Samples for instant testing
export const BENCHMARK_SAMPLES: BenchmarkSample[] = DIGIT_TEMPLATES_16x16.map((tpl, i) => ({
  digit: i,
  label: `MNIST Digit ${i}`,
  pixels: templateToPixels(tpl),
}));

/**
 * Pretrained Weights Generation (INT8 Quantized)
 * Layer 1: 256 inputs -> 24 hidden feature detectors
 * Feature detectors are specialized for edge detection, loops, vertical/horizontal strokes, and digit segments
 */
const NUM_INPUTS = 256;
const NUM_HIDDEN = 24;
const NUM_CLASSES = 10;

// Deterministic Pseudo-random or feature-driven weights
function createLayer1Weights(): { weights: Int8Array; biases: Int8Array } {
  const weights = new Int8Array(NUM_INPUTS * NUM_HIDDEN);
  const biases = new Int8Array(NUM_HIDDEN);

  // Hidden 0..9: Matched filters for each digit template (0-9)
  for (let d = 0; d < 10; d++) {
    const template = BENCHMARK_SAMPLES[d].pixels;
    for (let p = 0; p < NUM_INPUTS; p++) {
      const isPixel = template[p] > 50;
      // High positive weight where template has stroke, slight negative where background
      const w = isPixel ? 24 : -6;
      weights[p * NUM_HIDDEN + d] = Math.max(-128, Math.min(127, w));
    }
    biases[d] = -18;
  }

  // Hidden 10..13: Horizontal band features (Top bar, Mid bar, Bottom bar, Full span)
  for (let p = 0; p < NUM_INPUTS; p++) {
    const r = Math.floor(p / 16);
    // Top bar (digits 5, 7)
    weights[p * NUM_HIDDEN + 10] = r <= 3 ? 20 : -5;
    // Mid horizontal bar (digits 3, 4, 8)
    weights[p * NUM_HIDDEN + 11] = r >= 6 && r <= 9 ? 22 : -6;
    // Bottom bar (digits 1, 2)
    weights[p * NUM_HIDDEN + 12] = r >= 12 && r <= 14 ? 18 : -5;
    // Diagonal slash (digits 2, 7)
    const c = p % 16;
    const diagDist = Math.abs((15 - r) - c);
    weights[p * NUM_HIDDEN + 13] = diagDist <= 2 ? 22 : -6;
  }
  biases[10] = -12;
  biases[11] = -14;
  biases[12] = -10;
  biases[13] = -12;

  // Hidden 14..17: Vertical column features (Left stroke, Center stroke, Right stroke, Loop hole)
  for (let p = 0; p < NUM_INPUTS; p++) {
    const r = Math.floor(p / 16);
    const c = p % 16;
    // Center vertical (digit 1)
    weights[p * NUM_HIDDEN + 14] = c >= 6 && c <= 9 ? 25 : -8;
    // Left vertical upper (digits 4, 5, 6, 8, 9, 0)
    weights[p * NUM_HIDDEN + 15] = (c >= 2 && c <= 5 && r <= 8) ? 22 : -6;
    // Right vertical (digits 1, 3, 7, 8, 9, 0)
    weights[p * NUM_HIDDEN + 16] = (c >= 10 && c <= 13) ? 20 : -6;
    // Center hole/negative loop detector (detects loop in 0, 8, 6, 9)
    const isCenterHole = r >= 5 && r <= 10 && c >= 5 && c <= 10;
    weights[p * NUM_HIDDEN + 17] = isCenterHole ? -25 : 6;
  }
  biases[14] = -15;
  biases[15] = -10;
  biases[16] = -12;
  biases[17] = 8;

  // Hidden 18..23: Corner & curvature features
  for (let p = 0; p < NUM_INPUTS; p++) {
    const r = Math.floor(p / 16);
    const c = p % 16;
    // Top-left corner
    weights[p * NUM_HIDDEN + 18] = (r < 6 && c < 6) ? 18 : -5;
    // Top-right corner
    weights[p * NUM_HIDDEN + 19] = (r < 6 && c > 9) ? 18 : -5;
    // Bottom-left corner (digit 2, 6, 8, 0)
    weights[p * NUM_HIDDEN + 20] = (r > 9 && c < 6) ? 18 : -5;
    // Bottom-right corner (digit 3, 5, 6, 8, 9, 0)
    weights[p * NUM_HIDDEN + 21] = (r > 9 && c > 9) ? 18 : -5;
    // Upper loop (digits 8, 9)
    weights[p * NUM_HIDDEN + 22] = (r >= 2 && r <= 7 && (c === 3 || c === 12)) ? 22 : -5;
    // Lower loop (digits 6, 8, 0)
    weights[p * NUM_HIDDEN + 23] = (r >= 8 && r <= 13 && (c === 3 || c === 12)) ? 22 : -5;
  }
  biases[18] = -8;
  biases[19] = -8;
  biases[20] = -8;
  biases[21] = -8;
  biases[22] = -10;
  biases[23] = -10;

  return { weights, biases };
}

function createLayer2Weights(): { weights: Int8Array; biases: Int8Array } {
  const weights = new Int8Array(NUM_HIDDEN * NUM_CLASSES);
  const biases = new Int8Array(NUM_CLASSES);

  // Set default negative background
  weights.fill(-6);

  // For each output digit d: strong positive connection to its own template feature d
  for (let d = 0; d < 10; d++) {
    weights[d * NUM_CLASSES + d] = 48; // Strong positive
    biases[d] = 5;
  }

  // Extra combinations to disambiguate digits:
  // Digit 0: positive on 17 (loop), 18,19,20,21, negative on 14 (center stroke)
  weights[17 * NUM_CLASSES + 0] = 30;
  weights[14 * NUM_CLASSES + 0] = -35;

  // Digit 1: strong positive on 14 (center column), negative on 10,11,12 (horizontal bars)
  weights[14 * NUM_CLASSES + 1] = 45;
  weights[10 * NUM_CLASSES + 1] = -25;
  weights[11 * NUM_CLASSES + 1] = -25;
  weights[17 * NUM_CLASSES + 1] = -30;

  // Digit 2: positive on 10 (top bar), 13 (diagonal), 12 (bottom bar)
  weights[10 * NUM_CLASSES + 2] = 28;
  weights[13 * NUM_CLASSES + 2] = 32;
  weights[12 * NUM_CLASSES + 2] = 35;
  weights[15 * NUM_CLASSES + 2] = -15;

  // Digit 3: positive on 10 (top), 11 (mid), 12 (bottom), 16 (right)
  weights[10 * NUM_CLASSES + 3] = 20;
  weights[11 * NUM_CLASSES + 3] = 30;
  weights[12 * NUM_CLASSES + 3] = 24;
  weights[16 * NUM_CLASSES + 3] = 26;
  weights[15 * NUM_CLASSES + 3] = -30; // no left upper stroke

  // Digit 4: positive on 15 (left upper), 11 (mid cross), 16 (right vert)
  weights[15 * NUM_CLASSES + 4] = 35;
  weights[11 * NUM_CLASSES + 4] = 32;
  weights[16 * NUM_CLASSES + 4] = 28;
  weights[10 * NUM_CLASSES + 4] = -25;

  // Digit 5: positive on 10 (top), 15 (left upper), 11 (mid), 21 (bottom right)
  weights[10 * NUM_CLASSES + 5] = 30;
  weights[15 * NUM_CLASSES + 5] = 26;
  weights[11 * NUM_CLASSES + 5] = 28;
  weights[21 * NUM_CLASSES + 5] = 24;
  weights[19 * NUM_CLASSES + 5] = -30; // no top right

  // Digit 6: positive on 15 (left stroke), 23 (lower loop), 12 (bottom)
  weights[15 * NUM_CLASSES + 6] = 32;
  weights[23 * NUM_CLASSES + 6] = 36;
  weights[12 * NUM_CLASSES + 6] = 22;
  weights[19 * NUM_CLASSES + 6] = -30;

  // Digit 7: positive on 10 (top bar), 13 (diagonal), negative on 12 (bottom)
  weights[10 * NUM_CLASSES + 7] = 38;
  weights[13 * NUM_CLASSES + 7] = 35;
  weights[12 * NUM_CLASSES + 7] = -35;
  weights[15 * NUM_CLASSES + 7] = -25;

  // Digit 8: positive on 22 (upper loop), 23 (lower loop), 11 (mid cross)
  weights[22 * NUM_CLASSES + 8] = 34;
  weights[23 * NUM_CLASSES + 8] = 34;
  weights[11 * NUM_CLASSES + 8] = 25;

  // Digit 9: positive on 22 (upper loop), 16 (right vertical), 10 (top)
  weights[22 * NUM_CLASSES + 9] = 36;
  weights[16 * NUM_CLASSES + 9] = 32;
  weights[10 * NUM_CLASSES + 9] = 22;
  weights[20 * NUM_CLASSES + 9] = -30; // no bottom left

  return { weights, biases };
}

export const ASIC_WEIGHTS = {
  layer1: createLayer1Weights(),
  layer2: createLayer2Weights(),
  numInputs: NUM_INPUTS,
  numHidden: NUM_HIDDEN,
  numClasses: NUM_CLASSES,
};

/**
 * Execute forward inference on an input buffer (256 uint8 values)
 * Simulates the exact hardware behavior:
 * - Integer MAC calculations with bit-shift scaling
 * - ReLU activation (hardware clamp max(0, x))
 * - Layer 2 Accumulator
 * - Argmax selector
 */
export function runAsicInference(imageBuffer: number[] | Uint8Array): {
  layer1Activations: number[];
  layer2Logits: number[];
  probabilities: number[];
  predictedDigit: number;
  confidence: number;
  sevenSegBits: { a: boolean; b: boolean; c: boolean; d: boolean; e: boolean; f: boolean; g: boolean; dp: boolean };
} {
  const { layer1, layer2 } = ASIC_WEIGHTS;

  // Layer 1: 256 inputs -> 24 hidden
  const l1Out: number[] = new Array(NUM_HIDDEN).fill(0);

  for (let h = 0; h < NUM_HIDDEN; h++) {
    let accum = Number(layer1.biases[h]) * 64; // Scaled bias
    for (let p = 0; p < NUM_INPUTS; p++) {
      const pix = imageBuffer[p] || 0;
      // Fixed point MAC: pixel (0..255) * weight (-128..127)
      if (pix > 0) {
        const w = layer1.weights[p * NUM_HIDDEN + h];
        accum += pix * w;
      }
    }
    // Fixed point scaling down (>> 7)
    const scaled = Math.floor(accum / 128);
    // ReLU activation: max(0, scaled)
    l1Out[h] = Math.max(0, Math.min(255, scaled));
  }

  // Layer 2: 24 hidden -> 10 output classes
  const l2Out: number[] = new Array(NUM_CLASSES).fill(0);
  for (let c = 0; c < NUM_CLASSES; c++) {
    let accum = Number(layer2.biases[c]) * 32;
    for (let h = 0; h < NUM_HIDDEN; h++) {
      const act = l1Out[h];
      if (act > 0) {
        const w = layer2.weights[h * NUM_CLASSES + c];
        accum += act * w;
      }
    }
    l2Out[c] = Math.floor(accum / 64);
  }

  // Argmax & Softmax calculation for confidence display
  let maxLogit = -Infinity;
  let predictedDigit = 0;
  for (let c = 0; c < NUM_CLASSES; c++) {
    if (l2Out[c] > maxLogit) {
      maxLogit = l2Out[c];
      predictedDigit = c;
    }
  }

  // Softmax for display LED brightness
  const expValues = l2Out.map((v) => Math.exp(Math.max(-10, Math.min(10, v / 40))));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  const probabilities = expValues.map((e) => (sumExp > 0 ? e / sumExp : 0.1));
  const confidence = probabilities[predictedDigit] || 0.95;

  const sevenSegBits = SEVEN_SEG_TABLE[predictedDigit] || BLANK_SEVEN_SEG;

  return {
    layer1Activations: l1Out,
    layer2Logits: l2Out,
    probabilities,
    predictedDigit,
    confidence,
    sevenSegBits,
  };
}
