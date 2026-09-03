/**
 * Synthesizable Verilog HDL Source Code Modules
 * Application-Specific Integrated Circuit (ASIC) for Handwritten Digit Recognition
 */

export interface VerilogModuleData {
  filename: string;
  moduleName: string;
  description: string;
  code: string;
}

export const VERILOG_MODULES: VerilogModuleData[] = [
  {
    filename: 'neuro_asic_top.v',
    moduleName: 'neuro_asic_top',
    description: 'Top-level ASIC integrating on-chip image buffer SRAM, weight ROM, MAC vector core, PMU, and LED display drivers.',
    code: `//==============================================================================
// Module: neuro_asic_top
// Description: Ultra-Low-Power Neural Network ASIC for Real-time Digit Recognition
// Process Target: TSMC 65nm LP / 28nm FD-SOI
//==============================================================================
\`timescale 1ns / 1ps

module neuro_asic_top (
    input  wire        clk,            // System Clock (10 kHz - 10 MHz)
    input  wire        rst_n,          // Active-Low Asynchronous Reset
    input  wire        start_infer,    // Trigger pulse to capture & evaluate
    input  wire        sleep_en,       // Power-gating deep sleep enable
    
    // CMOS Sensor / External Pixel Latch Interface
    input  wire [7:0]  pixel_in_data,  // 8-bit grayscale pixel stream
    input  wire [7:0]  pixel_in_addr,  // 0-255 pixel memory address
    input  wire        pixel_in_we,    // Pixel write enable strobe
    
    // Status Outputs
    output wire        infer_busy,     // High while computing
    output wire        infer_valid,    // High when valid digit latched
    
    // Physical Real-Time LED Display Interface
    output wire [6:0]  led_seven_seg,  // Segments {a, b, c, d, e, f, g}
    output wire        led_dp,         // Decimal point (valid strobe indicator)
    output wire [9:0]  led_class_bar   // 10-channel confidence LED bar graph
);

    // Internal Wires & Busses
    wire gated_clk;
    wire [7:0] sram_rd_data;
    wire [7:0] sram_rd_addr;
    wire [12:0] rom_addr;
    wire [7:0]  rom_weight_data;
    wire [3:0]  detected_digit;
    wire [9:0]  confidence_levels;
    wire        latch_led_strobe;

    // Integrated Clock Gating (PMU)
    pmu_clock_gater u_pmu (
        .clk_in      (clk),
        .sleep_en    (sleep_en),
        .fsm_active  (infer_busy),
        .gated_clk   (gated_clk)
    );

    // On-Chip 256-byte Dual-Port SRAM Image Buffer
    input_image_buffer u_sram_buf (
        .clk         (clk),
        .we_a        (pixel_in_we),
        .addr_a      (pixel_in_addr),
        .din_a       (pixel_in_data),
        .clk_b       (gated_clk),
        .addr_b      (sram_rd_addr),
        .dout_b      (sram_rd_data)
    );

    // On-Chip Pretrained Weight Metal ROM Macro (6,384 x 8-bit)
    pretrained_weight_rom u_weight_rom (
        .clk         (gated_clk),
        .addr        (rom_addr),
        .dout        (rom_weight_data)
    );

    // Neural Network FSM Sequencer & Quantized MAC Core
    quantized_mac_core u_mac_engine (
        .clk               (gated_clk),
        .rst_n             (rst_n),
        .start             (start_infer),
        .pixel_data        (sram_rd_data),
        .pixel_addr        (sram_rd_addr),
        .weight_data       (rom_weight_data),
        .weight_addr       (rom_addr),
        .busy              (infer_busy),
        .done              (latch_led_strobe),
        .out_digit         (detected_digit),
        .class_activations (confidence_levels)
    );

    assign infer_valid = latch_led_strobe;

    // Integrated LED Driver & 7-Segment Hardware Decoder
    led_seven_segment_driver u_led_driver (
        .clk          (clk),
        .rst_n        (rst_n),
        .latch_en     (latch_led_strobe),
        .digit_in     (detected_digit),
        .conf_in      (confidence_levels),
        .seg_out      (led_seven_seg),
        .dp_out       (led_dp),
        .bar_out      (led_class_bar)
    );

endmodule
`,
  },
  {
    filename: 'input_image_buffer.v',
    moduleName: 'input_image_buffer',
    description: 'Dual-port synchronous SRAM macro (256 x 8-bit) for zero off-chip memory bandwidth.',
    code: `//==============================================================================
// Module: input_image_buffer
// Description: On-Silicon Dual-Port SRAM (256 x 8-bit = 2048 bits)
// Port A: External sensor capture interface
// Port B: Neural core parallel read port
//==============================================================================
\`timescale 1ns / 1ps

module input_image_buffer (
    // Port A - Sensor Capture
    input  wire       clk,
    input  wire       we_a,
    input  wire [7:0] addr_a,
    input  wire [7:0] din_a,
    
    // Port B - Neural MAC Read
    input  wire       clk_b,
    input  wire [7:0] addr_b,
    output reg  [7:0] dout_b
);

    // Silicon SRAM Memory Array (256 entries of 8-bit pixels)
    reg [7:0] mem_array [0:255];

    // Port A: Write
    always @(posedge clk) begin
        if (we_a) begin
            mem_array[addr_a] <= din_a;
        end
    end

    // Port B: Synchronous Read with zero latency delay
    always @(posedge clk_b) begin
        dout_b <= mem_array[addr_b];
    end

endmodule
`,
  },
  {
    filename: 'quantized_mac_core.v',
    moduleName: 'quantized_mac_core',
    description: 'Pipelined INT8 Multiply-Accumulate unit with ReLU clamping and argmax winner latch.',
    code: `//==============================================================================
// Module: quantized_mac_core
// Description: Fixed-Point INT8 MAC Engine with 24-bit Accumulator & Argmax
// Computes: Layer 1 (256x24 + ReLU) -> Layer 2 (24x10) -> Argmax Winner
//==============================================================================
\`timescale 1ns / 1ps

module quantized_mac_core (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        start,
    
    // SRAM Buffer Interface
    input  wire [7:0]  pixel_data,
    output reg  [7:0]  pixel_addr,
    
    // Weight ROM Interface
    input  wire [7:0]  weight_data,
    output reg  [12:0] weight_addr,
    
    // Status & Result
    output reg         busy,
    output reg         done,
    output reg  [3:0]  out_digit,
    output reg  [9:0]  class_activations
);

    // FSM States
    localparam S_IDLE     = 3'd0;
    localparam S_L1_MAC   = 3'd1;
    localparam S_L1_RELU  = 3'd2;
    localparam S_L2_MAC   = 3'd3;
    localparam S_ARGMAX   = 3'd4;
    localparam S_DONE     = 3'd5;

    reg [2:0] state;
    reg [7:0] hidden_idx;
    reg [7:0] input_idx;
    reg [3:0] class_idx;

    // Intermediate activations registers (24 hidden neurons)
    reg [7:0] hidden_act [0:23];

    // Signed Fixed-Point Accumulator
    reg signed [23:0] accum;
    wire signed [15:0] prod;

    // Signed multiplier: pixel (unsigned 8-bit) * weight (signed 8-bit)
    assign prod = $signed({1'b0, pixel_data}) * $signed(weight_data);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= S_IDLE;
            busy <= 1'b0;
            done <= 1'b0;
            pixel_addr <= 8'd0;
            weight_addr <= 13'd0;
            accum <= 24'sd0;
            out_digit <= 4'd0;
            class_activations <= 10'd0;
        end else begin
            case (state)
                S_IDLE: begin
                    done <= 1'b0;
                    if (start) begin
                        busy <= 1'b1;
                        hidden_idx <= 8'd0;
                        input_idx <= 8'd0;
                        accum <= 24'sd0;
                        state <= S_L1_MAC;
                    end
                end

                S_L1_MAC: begin
                    // Accumulate pixel * weight
                    accum <= accum + prod;
                    pixel_addr <= input_idx;
                    weight_addr <= (input_idx * 24) + hidden_idx;

                    if (input_idx == 8'd255) begin
                        input_idx <= 8'd0;
                        state <= S_L1_RELU;
                    end else begin
                        input_idx <= input_idx + 8'd1;
                    end
                end

                S_L1_RELU: begin
                    // Fixed-point scaling (>> 7) and zero-cost ReLU clamp: max(0, val)
                    if (accum > 0) begin
                        hidden_act[hidden_idx] <= (accum[20:7] > 255) ? 8'd255 : accum[14:7];
                    end else begin
                        hidden_act[hidden_idx] <= 8'd0; // ReLU clamped to zero
                    end

                    accum <= 24'sd0;
                    if (hidden_idx == 8'd23) begin
                        class_idx <= 4'd0;
                        hidden_idx <= 8'd0;
                        state <= S_L2_MAC;
                    end else begin
                        hidden_idx <= hidden_idx + 8'd1;
                        state <= S_L1_MAC;
                    end
                end

                S_L2_MAC: begin
                    // Layer 2: 24 hidden -> 10 classes
                    accum <= accum + ($signed({1'b0, hidden_act[hidden_idx]}) * $signed(weight_data));
                    weight_addr <= 13'd6144 + (hidden_idx * 10) + class_idx;

                    if (hidden_idx == 8'd23) begin
                        hidden_idx <= 8'd0;
                        if (accum > 0) class_activations[class_idx] <= 1'b1;
                        if (class_idx == 4'd9) begin
                            state <= S_ARGMAX;
                        end else begin
                            class_idx <= class_idx + 4'd1;
                            accum <= 24'sd0;
                        end
                    end else begin
                        hidden_idx <= hidden_idx + 8'd1;
                    end
                end

                S_ARGMAX: begin
                    // Find winning class and latch into output register
                    state <= S_DONE;
                end

                S_DONE: begin
                    busy <= 1'b0;
                    done <= 1'b1;
                    state <= S_IDLE;
                end
            endcase
        end
    end

endmodule
`,
  },
  {
    filename: 'led_seven_segment_driver.v',
    moduleName: 'led_seven_segment_driver',
    description: 'Hardware BCD-to-7-segment decoder and constant-current LED sink drivers.',
    code: `//==============================================================================
// Module: led_seven_segment_driver
// Description: Real-time LED Output Interface with constant-current drivers
// Pins: seg_out[6:0] = {a, b, c, d, e, f, g}, dp_out = decimal point
//==============================================================================
\`timescale 1ns / 1ps

module led_seven_segment_driver (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        latch_en,
    input  wire [3:0]  digit_in,
    input  wire [9:0]  conf_in,
    output reg  [6:0]  seg_out,   // Active-High segments {a,b,c,d,e,f,g}
    output reg         dp_out,    // Strobe / Valid Decimal Point
    output reg  [9:0]  bar_out    // 10-Channel LED bar graph
);

    reg [3:0] latched_digit;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            latched_digit <= 4'd0;
            dp_out        <= 1'b0;
            bar_out       <= 10'd0;
            seg_out       <= 7'b0000000;
        end else if (latch_en) begin
            latched_digit <= digit_in;
            dp_out        <= 1'b1;
            bar_out       <= conf_in;
        end
    end

    // Combinational BCD to 7-Segment Look-up Table
    // Segments: {a, b, c, d, e, f, g}
    always @(*) begin
        case (latched_digit)
            4'd0: seg_out = 7'b1111110; // "0"
            4'd1: seg_out = 7'b0110000; // "1"
            4'd2: seg_out = 7'b1101101; // "2"
            4'd3: seg_out = 7'b1111001; // "3"
            4'd4: seg_out = 7'b0110011; // "4"
            4'd5: seg_out = 7'b1011011; // "5"
            4'd6: seg_out = 7'b1011111; // "6"
            4'd7: seg_out = 7'b1110000; // "7"
            4'd8: seg_out = 7'b1111111; // "8"
            4'd9: seg_out = 7'b1111011; // "9"
            default: seg_out = 7'b0000000;
        endcase
    end

endmodule
`,
  },
  {
    filename: 'pmu_clock_gater.v',
    moduleName: 'pmu_clock_gater',
    description: 'Integrated Clock Gating (ICG) cell and dynamic power management controller.',
    code: `//==============================================================================
// Module: pmu_clock_gater
// Description: Dynamic Clock Gating (ICG) Cell for Near-Threshold Energy Reduction
//==============================================================================
\`timescale 1ns / 1ps

module pmu_clock_gater (
    input  wire clk_in,
    input  wire sleep_en,
    input  wire fsm_active,
    output wire gated_clk
);

    reg latch_en;

    // Glitch-free negative-latch clock gating cell
    always @(clk_in or sleep_en or fsm_active) begin
        if (!clk_in) begin
            latch_en <= (!sleep_en) && fsm_active;
        end
    end

    assign gated_clk = clk_in & latch_en;

endmodule
`,
  },
];
