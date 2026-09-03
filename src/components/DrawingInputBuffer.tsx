import React, { useRef, useState, useEffect } from 'react';
import { BENCHMARK_SAMPLES } from '../utils/modelWeights';
import { Eraser, RotateCcw, Sparkles, Cpu, Eye } from 'lucide-react';

interface DrawingInputBufferProps {
  pixels: number[];
  onPixelChange: (newPixels: number[]) => void;
  onSelectBenchmark: (digit: number) => void;
  isRecognizing: boolean;
}

export const DrawingInputBuffer: React.FC<DrawingInputBufferProps> = ({
  pixels,
  onPixelChange,
  onSelectBenchmark,
  isRecognizing,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [showSramHex, setShowSramHex] = useState(false);
  const [brushSize, setBrushSize] = useState<1 | 2>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync canvas with pixels prop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 256, 256);

    const pixelSize = 256 / 16;
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const val = pixels[r * 16 + c] || 0;
        if (val > 0) {
          // Phosphor glowing pixel style
          ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize - 0.5, pixelSize - 0.5);
        } else {
          // Faint sensor grid line
          ctx.strokeStyle = '#18181b';
          ctx.strokeRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }, [pixels]);

  const drawPixelAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const col = Math.floor((x / rect.width) * 16);
    const row = Math.floor((y / rect.height) * 16);

    if (col >= 0 && col < 16 && row >= 0 && row < 16) {
      const updated = [...pixels];
      // Paint target and neighboring cells for natural stroke
      const offsets =
        brushSize === 2
          ? [
              [0, 0, 255],
              [0, 1, 180],
              [1, 0, 180],
              [0, -1, 180],
              [-1, 0, 180],
            ]
          : [
              [0, 0, 255],
              [0, 1, 140],
              [1, 0, 140],
            ];

      offsets.forEach(([dr, dc, intensity]) => {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < 16 && nc >= 0 && nc < 16) {
          const idx = nr * 16 + nc;
          updated[idx] = Math.max(updated[idx] || 0, intensity);
        }
      });
      onPixelChange(updated);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    drawPixelAt(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    drawPixelAt(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    if (e.touches.length > 0) {
      drawPixelAt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || e.touches.length === 0) return;
    drawPixelAt(e.touches[0].clientX, e.touches[0].clientY);
  };

  const clearCanvas = () => {
    onPixelChange(new Array(256).fill(0));
  };

  const addSensorNoise = () => {
    const noisy = pixels.map((p) => {
      const delta = (Math.random() - 0.5) * 60;
      return Math.max(0, Math.min(255, Math.round(p + delta)));
    });
    onPixelChange(noisy);
  };

  return (
    <div
      id="on-chip-input-buffer-container"
      className="flex flex-col gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-300">
            ON-CHIP IMAGE BUFFER (256B SRAM)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSramHex(!showSramHex)}
            className={`flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
              showSramHex
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Hex SRAM dump"
          >
            <Eye className="w-3 h-3" />
            {showSramHex ? 'Hex View' : 'Sensor View'}
          </button>
        </div>
      </div>

      {/* Main interactive area */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Canvas / Hex View */}
        <div className="relative flex flex-col items-center">
          {!showSramHex ? (
            <div className="relative p-1 bg-zinc-900 rounded-xl border border-zinc-800 shadow-inner">
              <canvas
                ref={canvasRef}
                width={256}
                height={256}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className="w-56 h-56 sm:w-60 sm:h-60 rounded-lg cursor-crosshair touch-none bg-black"
              />
              <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-black/80 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800 pointer-events-none">
                16x16 CMOS ARRAY
              </div>
            </div>
          ) : (
            <div className="w-56 h-56 sm:w-60 sm:h-60 p-2 bg-black rounded-xl border border-zinc-800 font-mono text-[9px] overflow-y-auto leading-none text-zinc-400 select-all">
              <div className="text-zinc-400 mb-1 border-b border-zinc-900 pb-1 font-bold">
                // Dual-Port SRAM [0x00..0xFF]
              </div>
              <div className="grid grid-cols-8 gap-x-2 gap-y-1">
                {pixels.map((val, idx) => (
                  <span
                    key={idx}
                    className={`${
                      val > 100
                        ? 'text-emerald-400 font-bold bg-emerald-950/40 px-0.5 rounded'
                        : val > 0
                        ? 'text-zinc-300'
                        : 'text-zinc-400'
                    }`}
                  >
                    {val.toString(16).padStart(2, '0').toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick controls under canvas */}
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-800 transition"
            >
              <Eraser className="w-3 h-3" /> Clear
            </button>
            <button
              type="button"
              onClick={addSensorNoise}
              className="flex items-center gap-1 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-800 transition"
              title="Inject random ADC noise"
            >
              <Sparkles className="w-3 h-3" /> Noise
            </button>
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setBrushSize(1)}
                className={`px-2 py-0.5 rounded ${
                  brushSize === 1 ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                1px
              </button>
              <button
                type="button"
                onClick={() => setBrushSize(2)}
                className={`px-2 py-0.5 rounded ${
                  brushSize === 2 ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                }`}
              >
                2px
              </button>
            </div>
          </div>
        </div>

        {/* Preset MNIST Benchmark Buttons */}
        <div className="flex flex-col gap-1.5 w-full sm:w-44">
          <div className="text-[11px] font-mono text-zinc-400 font-semibold flex items-center justify-between">
            <span>PRELOAD SAMPLES</span>
            <span className="text-[9px] text-zinc-400">MNIST TEST VECTORS</span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5">
            {BENCHMARK_SAMPLES.map((sample) => (
              <button
                key={sample.digit}
                type="button"
                onClick={() => onSelectBenchmark(sample.digit)}
                className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/60 transition group text-zinc-300"
              >
                <span className="text-sm font-bold font-mono group-hover:text-emerald-400">
                  {sample.digit}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1">
            <div className="flex justify-between">
              <span>SRAM Address:</span>
              <span className="text-zinc-300">0x00 - 0xFF</span>
            </div>
            <div className="flex justify-between">
              <span>Data Bus Width:</span>
              <span className="text-zinc-300">8-bit parallel</span>
            </div>
            <div className="flex justify-between">
              <span>DRAM Traffic:</span>
              <span className="text-emerald-400 font-bold">0 Bytes (Zero-Fetch)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
