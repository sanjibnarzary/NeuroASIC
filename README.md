# NeuroASIC-10D: Ultra-Low-Power Neural Hardware Simulator & Designer

**NeuroASIC-10D** is an interactive Application-Specific Integrated Circuit (ASIC) architecture designer and hardware simulator for ultra-low-power handwritten digit recognition.

Designed for edge AI silicon applications, it eliminates energy-costly off-chip DRAM/SRAM bus crossings by integrating the complete neural inference pipeline directly on-chip:
- **On-Silicon 256-Byte Dual-Port SRAM Image Buffer** ($16 \times 16$ 8-bit grayscale pixels).
- **Integrated Pretrained Metal-Diffusion Weight ROM Macro** (6,384 INT8 weights and biases).
- **Quantized Neural Core**: INT8 fixed-point vector Multiply-Accumulate (MAC) units with 24-bit saturation accumulators.
- **Physical Output Peripheral Drivers**: Direct active-high 7-segment LED cathode/anode driver with decimal point strobe and a 10-channel confidence annunciator LED bar.
- **Cycle-Accurate RTL Stepper & Synthesizable Verilog**: Complete hardware definition files (`neuro_asic_top.v`, `input_image_buffer.v`, `quantized_mac_core.v`, `led_seven_segment_driver.v`, `pmu_clock_gater.v`).
- **Near-Threshold CMOS Physics Modeling**: Interactive voltage scaling ($0.50\,\text{V} - 1.20\,\text{V}$), dynamic clock gating (ICG), and multi-foundry process nodes (180nm, 65nm LP, 28nm FD-SOI).

---

## 1. System Requirements

Ensure your host machine satisfies the following hardware and software specifications before installing:

### Hardware Specifications
| Specification | Minimum Requirement | Recommended |
|---|---|---|
| **CPU** | Dual-core 1.5 GHz or higher (x86-64 / ARM64 / Apple Silicon) | Quad-core 2.0 GHz or higher |
| **RAM** | 2 GB available system memory | 4 GB+ |
| **Storage** | 350 MB free disk space (for source code, `node_modules`, and build cache) | 1 GB+ |
| **Display** | 1280 × 720 resolution | 1920 × 1080 resolution or higher |

### Software & Runtime Environment
| Software | Required Version | Verification Command |
|---|---|---|
| **Operating System** | Linux (Ubuntu 20.04+, Debian, Fedora, Arch), macOS (11+), or Windows 10/11 (PowerShell, CMD, or WSL2) | `uname -s` (Linux/macOS) |
| **Node.js** | **v18.0.0 or higher** (v20.x or v22.x LTS recommended) | `node -v` |
| **Package Manager** | `npm` v9.0.0+ (bundled with Node.js), or `pnpm` / `yarn` | `npm -v` |
| **Web Browser** | Any modern web browser with HTML5 Canvas and ES2022 support (Google Chrome 100+, Mozilla Firefox 100+, Safari 15+, Microsoft Edge 100+) | — |

---

## 2. Required Libraries & Dependencies

All dependencies are defined in `package.json` and will be automatically resolved by `npm install`:

### Core Runtime Dependencies
- **`react`** (`^19.0.1`) & **`react-dom`** (`^19.0.1`): Declarative UI rendering engine with concurrent capabilities.
- **`lucide-react`** (`^0.546.0`): SVG engineering and hardware interface icons (circuit, cpu, zap, gauge, terminal, etc.).
- **`motion`** (`^12.23.24`): Hardware transition, phosphor glow, and waveform animations.
- **`express`** (`^4.21.2`) & **`dotenv`** (`^17.2.3`): Optional full-stack server middleware for custom deployment pipelines.
- **`@google/genai`** (`^2.4.0`): Server-side AI client SDK integration support.

### Styling & Build Tooling
- **`vite`** (`^6.2.3`): High-performance ESM build tool and local development server.
- **`@vitejs/plugin-react`** (`^5.0.4`): Fast React Refresh and JSX transform plugin.
- **`tailwindcss`** (`^4.1.14`) & **`@tailwindcss/vite`** (`^4.1.14`): Modern utility-first CSS framework with native Vite compiler integration.
- **`typescript`** (`~5.8.2`): Strict static type checking across hardware models and simulation math.
- **`tsx`** (`^4.21.0`): High-speed TypeScript execution engine for server runtimes.
- **`esbuild`** (`^0.25.0`): Fast bundler for production server compilation.

---

## 3. Step-by-Step Installation Guide

Follow these steps to clone, configure, and launch the application on your system:

### Step 1: Verify Node.js and npm
Open your terminal or command prompt and verify that Node.js (version 18 or above) is installed:
```bash
node -v
npm -v
```
*(If Node.js is not installed, download the current LTS release from [nodejs.org](https://nodejs.org/).)*

### Step 2: Navigate to the Project Directory
Change directory to the root of the project:
```bash
cd /path/to/neuro-asic
```

### Step 3: Install Required Dependencies
Install all production and development packages:
```bash
npm install
```
*Tip: If you prefer `pnpm` or `yarn`, you can run `pnpm install` or `yarn install` instead.*

### Step 4: Configure Environment Variables (Optional)
If you require custom environment configurations, copy the example environment file:
```bash
cp .env.example .env
```
*(By default, no external API keys are strictly needed for the local hardware simulation and Verilog code generator).*

### Step 5: Launch the Development Server
Start the local Vite development server:
```bash
npm run dev
```

You should see output similar to:
```text
  VITE v6.2.3  ready in 240 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

### Step 6: Open the Application in Your Browser
Open your web browser and navigate to:
```text
http://localhost:3000
```

---

## 4. Available NPM Scripts

The project includes several pre-configured scripts in `package.json`:

| Command | Action | Description |
|---|---|---|
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Starts the local dev server on port `3000` with network access enabled. |
| `npm run build` | `vite build` | Compiles and optimizes the React/TypeScript codebase into the static `dist/` directory. |
| `npm run preview` | `vite preview` | Locally serves the production `dist/` build to preview deployment behavior. |
| `npm run lint` | `tsc --noEmit` | Runs the TypeScript compiler to validate static types and detect syntax errors without generating files. |
| `npm run clean` | `rm -rf dist server.js` | Removes previous build artifacts and compiled assets. |

---

## 5. Architectural Overview & Simulation Features

Once the application is running, you can explore five specialized engineering interfaces:

### 1. Chip System & Physical LED Interface
- **$16 \times 16$ Dual-Port SRAM Drawing Canvas**: Draw digits with your mouse/touchpad or load standard MNIST test patterns. Features Gaussian noise injection to test hardware noise tolerance.
- **Physical 7-Segment Output Display**: Active-high cathode/anode LED segment decoding (`seg[6:0] = {a, b, c, d, e, f, g}`) with phosphor emission, customizable LED color channels (Ruby Red, Emerald Green, Amber Glow, Ice Blue), and decimal point valid strobe.
- **10-Channel Annunciator LED Bar**: Displays classified digit probabilities with hardware-modeled current-limited drivers.
- **Silicon Pin Telemetry**: Real-time pinout status for `PWR_GOOD`, `CLK_ACTIVE`, `INFER_BUSY`, `VALID_STROBE`, and `SLEEP_GATE`.

### 2. Silicon Die Floorplan
- Real-time 2D spatial die floorplan diagram with macro coordinates for the input buffer, weight ROM, MAC vector unit, tournament argmax comparator, LED driver block, PMU, and QFN pad ring.
- Live transistor counts, gate densities, active bus traffic highlighting, and silicon area estimation ($1.42\,\text{mm}^2$ in 65nm).

### 3. Cycle-Accurate RTL Stepper
- Clock-by-clock finite state machine (FSM) execution (`IDLE` $\to$ `LATCH_IMG` $\to$ `L1_MAC` $\to$ `L1_RELU` $\to$ `L2_MAC` $\to$ `ARGMAX` $\to$ `LED_OUT`).
- Cycle timer, current pipeline stage inspector, accumulator register values, and cycle-by-cycle memory address bus tracking.

### 4. Near-Threshold Power & Silicon Physics
- Interactive supply voltage scaling ($V_{DD}$ from $0.50\,\text{V}$ to $1.20\,\text{V}$).
- Real-time dynamic switching power calculation ($P_{dyn} = \alpha C V_{DD}^2 f$) and sub-threshold leakage modeling ($I_{leak} \propto e^{\frac{-V_{th}}{\eta V_T}}$).
- Foundry node comparison (180nm TSMC Generic, 65nm Low-Power LP, 28nm FD-SOI).
- Dynamic Clock Gating (ICG) toggle showing active power reductions exceeding 65%.

### 5. Synthesizable Verilog RTL & Pinout
- Verilog-2001 synthesizable hardware modules ready for FPGA or standard-cell ASIC synthesis:
  - `neuro_asic_top.v`
  - `input_image_buffer.v`
  - `quantized_mac_core.v`
  - `led_seven_segment_driver.v`
  - `pmu_clock_gater.v`
- Standard 5×5mm QFN-32 package pin mapping with complete electrical specifications ($V_{OH}, V_{OL}, I_{sink}$).

---

## 6. Troubleshooting & Common Questions

### Q1: "Port 3000 is already in use"
If port `3000` is being used by another process on your machine, you can run Vite on a different port:
```bash
npx vite --port 3001
```
Or identify and terminate the process holding port 3000:
- **Linux/macOS**:
  ```bash
  lsof -i :3000
  kill -9 <PID>
  ```
- **Windows (PowerShell)**:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
  ```

### Q2: TypeScript linting or compile issues
Run the lint script to verify clean TypeScript compilation:
```bash
npm run lint
```
If errors appear regarding missing packages, delete `node_modules` and re-install:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Q3: Building for Production Deployment
To create an optimized production build:
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory, ready to be deployed to any static host (Cloud Run, Nginx, Vercel, Netlify, or GitHub Pages).

---

## 7. License
This project is open for educational, academic, and hardware architecture simulation purposes.
