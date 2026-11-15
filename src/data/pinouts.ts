/**
 * Pinout dataset for common ICs and microcontroller boards.
 * Values are typical datasheet figures — always confirm against the
 * datasheet for your exact part/board revision before designing.
 */

export type PinFunction =
  | "VCC"
  | "GND"
  | "GPIO"
  | "PWM"
  | "ADC"
  | "DAC"
  | "I2C"
  | "SPI"
  | "UART"
  | "Touch"
  | "Interrupt"
  | "Input"
  | "Output"
  | "Analog"
  | "Control"
  | "Reset"
  | "Strapping"
  | "NC";

export type PinDirection = "input" | "output" | "bidirectional" | "power" | "ground" | "nc";

export interface Pin {
  /** Unique within the device — physical pin number for ICs, header label for boards. */
  id: string;
  /** Physical number or position label shown on the diagram. */
  number: string;
  name: string;
  /** Alternate names / peripheral mappings. */
  alt?: string[];
  functions: PinFunction[];
  direction: PinDirection;
  description: string;
  voltage: string;
  notes?: string;
}

export interface DeviceSpec {
  label: string;
  value: string;
}

export interface Device {
  id: string;
  name: string;
  fullName: string;
  category: "Timer IC" | "Op-Amp IC" | "Microcontroller Board";
  package: string;
  description: string;
  specs: DeviceSpec[];
  /** Diagram layout: pin ids top→bottom on each side. */
  layout: {
    style: "dip" | "board";
    left: string[];
    right: string[];
    /** Optional label for each side (e.g. header names). */
    leftLabel?: string;
    rightLabel?: string;
  };
  pins: Pin[];
  notes: string[];
  datasheetHint: string;
}

/* --------------------------------- NE555 -------------------------------- */

const NE555: Device = {
  id: "ne555",
  name: "NE555",
  fullName: "NE555 Precision Timer",
  category: "Timer IC",
  package: "DIP-8 / SOIC-8",
  description:
    "Classic bipolar timer for monostable (one-shot), astable (oscillator) and bistable operation. Internally two comparators referenced to 1/3 and 2/3 of VCC drive an SR flip-flop and a discharge transistor.",
  specs: [
    { label: "Supply voltage", value: "4.5 V – 16 V (abs. max 18 V)" },
    { label: "Supply current", value: "3 – 6 mA @ 5 V (output low)" },
    { label: "Output current", value: "±200 mA sink/source" },
    { label: "Max frequency", value: "≈ 500 kHz (astable)" },
    { label: "Timing accuracy", value: "≈ 1% (monostable, 5 V)" },
    { label: "Thresholds", value: "Trigger 1/3·VCC, Threshold 2/3·VCC" },
  ],
  layout: { style: "dip", left: ["1", "2", "3", "4"], right: ["8", "7", "6", "5"] },
  pins: [
    {
      id: "1",
      number: "1",
      name: "GND",
      functions: ["GND"],
      direction: "ground",
      description: "Ground reference (0 V). Connect to the negative supply rail.",
      voltage: "0 V",
    },
    {
      id: "2",
      number: "2",
      name: "TRIG",
      alt: ["Trigger", "¬TRIG"],
      functions: ["Input", "Control"],
      direction: "input",
      description:
        "Trigger input. When the voltage falls below 1/3·VCC (or ½ of CTRL), the flip-flop is set: output goes HIGH and the discharge transistor turns off, starting the timing cycle.",
      voltage: "0 V – VCC, active below 1/3·VCC",
      notes: "Trigger pulse must be shorter than the output pulse in monostable mode.",
    },
    {
      id: "3",
      number: "3",
      name: "OUT",
      alt: ["Output"],
      functions: ["Output", "PWM"],
      direction: "output",
      description:
        "Totem-pole output. HIGH ≈ VCC − 1.7 V, LOW ≈ 0.1 V. Can directly drive LEDs, relays (with flyback diode) or logic inputs.",
      voltage: "≈ 0.1 V (low) to VCC − 1.7 V (high)",
      notes: "Sinks or sources up to 200 mA.",
    },
    {
      id: "4",
      number: "4",
      name: "RESET",
      alt: ["¬RESET"],
      functions: ["Reset", "Control", "Input"],
      direction: "input",
      description:
        "Active-low reset. Pulling below ≈ 0.7 V forces the output LOW and turns on the discharge transistor regardless of other inputs. Tie to VCC when unused.",
      voltage: "Reset threshold 0.3 – 1.0 V (typ. 0.7 V)",
    },
    {
      id: "5",
      number: "5",
      name: "CTRL",
      alt: ["Control Voltage", "CV"],
      functions: ["Control", "Analog", "Input"],
      direction: "input",
      description:
        "Direct access to the 2/3·VCC divider node. Apply a voltage to modulate timing (PWM / VCO). Otherwise decouple to GND with a 10 nF capacitor to reject noise.",
      voltage: "Nominal 2/3·VCC",
    },
    {
      id: "6",
      number: "6",
      name: "THR",
      alt: ["Threshold"],
      functions: ["Input", "Analog"],
      direction: "input",
      description:
        "Threshold input. When the voltage rises above 2/3·VCC (the CTRL level), the flip-flop resets: output goes LOW and the discharge transistor turns on.",
      voltage: "0 V – VCC, trips at 2/3·VCC",
    },
    {
      id: "7",
      number: "7",
      name: "DIS",
      alt: ["Discharge"],
      functions: ["Output"],
      direction: "output",
      description:
        "Open-collector discharge transistor. Shorts the timing capacitor to GND while the output is LOW. Can also be used as an open-collector output with a pull-up.",
      voltage: "0 V – VCC (open collector)",
    },
    {
      id: "8",
      number: "8",
      name: "VCC",
      alt: ["V+"],
      functions: ["VCC"],
      direction: "power",
      description: "Positive supply. Decouple with 100 nF (plus ≥10 µF bulk) close to the pin — the 555 draws large current spikes on output transitions.",
      voltage: "4.5 V – 16 V",
    },
  ],
  notes: [
    "Astable: f = 1.44 / ((R1 + 2R2)·C), duty = (R1 + R2) / (R1 + 2R2).",
    "Monostable: pulse width t = 1.1·R·C.",
    "CMOS versions (TLC555, ICM7555, LMC555) run from 2 V and draw far less current.",
  ],
  datasheetHint: "Texas Instruments NE555 datasheet (SLFS022)",
};

/* --------------------------------- LM741 -------------------------------- */

const LM741: Device = {
  id: "lm741",
  name: "LM741",
  fullName: "LM741 General-Purpose Operational Amplifier",
  category: "Op-Amp IC",
  package: "DIP-8 / SOIC-8",
  description:
    "Industry-standard single bipolar op-amp with internal frequency compensation, short-circuit protection and offset-null capability. Ideal for learning, but slow and not rail-to-rail.",
  specs: [
    { label: "Supply voltage", value: "±5 V to ±18 V (LM741C abs. max ±18 V, LM741 ±22 V)" },
    { label: "Open-loop gain", value: "≈ 200 000 (106 dB) typ." },
    { label: "Gain-bandwidth", value: "≈ 1 MHz" },
    { label: "Slew rate", value: "≈ 0.5 V/µs" },
    { label: "Input offset voltage", value: "1 mV typ., 6 mV max" },
    { label: "Input resistance", value: "≈ 2 MΩ" },
    { label: "Output swing", value: "±13 V typ. @ ±15 V, R_L = 2 kΩ" },
  ],
  layout: { style: "dip", left: ["1", "2", "3", "4"], right: ["8", "7", "6", "5"] },
  pins: [
    {
      id: "1",
      number: "1",
      name: "OFFSET N1",
      alt: ["Offset Null 1"],
      functions: ["Control", "Analog"],
      direction: "input",
      description:
        "Offset null. Connect the ends of a 10 kΩ potentiometer between pins 1 and 5 with the wiper to V−, then trim for 0 V output with the inputs grounded.",
      voltage: "Near V− (do not drive)",
    },
    {
      id: "2",
      number: "2",
      name: "IN−",
      alt: ["Inverting input"],
      functions: ["Input", "Analog"],
      direction: "input",
      description: "Inverting input. Feedback resistor Rf returns here from the output in both inverting and non-inverting configurations.",
      voltage: "Common-mode range ±12 V typ. @ ±15 V",
      notes: "Max differential input ±30 V.",
    },
    {
      id: "3",
      number: "3",
      name: "IN+",
      alt: ["Non-inverting input"],
      functions: ["Input", "Analog"],
      direction: "input",
      description: "Non-inverting input. Signal input for non-inverting amplifiers / voltage followers; tie to ground (or bias) for inverting amplifiers.",
      voltage: "Common-mode range ±12 V typ. @ ±15 V",
    },
    {
      id: "4",
      number: "4",
      name: "V−",
      alt: ["VEE", "VS−"],
      functions: ["VCC", "GND"],
      direction: "power",
      description: "Negative supply. Connect to −Vs for dual-supply operation, or to GND for single-supply (bias inputs to mid-rail).",
      voltage: "−5 V to −18 V (or 0 V single supply)",
    },
    {
      id: "5",
      number: "5",
      name: "OFFSET N2",
      alt: ["Offset Null 2"],
      functions: ["Control", "Analog"],
      direction: "input",
      description: "Second offset-null terminal (see pin 1). Leave unconnected if offset trimming is not needed.",
      voltage: "Near V− (do not drive)",
    },
    {
      id: "6",
      number: "6",
      name: "OUT",
      alt: ["Output"],
      functions: ["Output", "Analog"],
      direction: "output",
      description: "Amplifier output, short-circuit protected (≈ 25 mA). Swings to about 1–2 V from each rail.",
      voltage: "≈ V− + 2 V to V+ − 2 V",
    },
    {
      id: "7",
      number: "7",
      name: "V+",
      alt: ["VCC", "VS+"],
      functions: ["VCC"],
      direction: "power",
      description: "Positive supply. Decouple each rail with 100 nF to ground close to the package.",
      voltage: "+5 V to +18 V",
    },
    {
      id: "8",
      number: "8",
      name: "NC",
      alt: ["No connection"],
      functions: ["NC"],
      direction: "nc",
      description: "Not internally connected.",
      voltage: "—",
    },
  ],
  notes: [
    "Inverting: Av = −Rf/Rin. Non-inverting: Av = 1 + Rf/Rg.",
    "Not rail-to-rail — for 3.3 V / 5 V single-supply designs prefer LM358, MCP6002 or TLV9002.",
    "Pinout is shared by most single op-amps (TL071, OP07, NE5534 …).",
  ],
  datasheetHint: "Texas Instruments LM741 datasheet (SNOSC25)",
};

/* ------------------------------ Arduino Uno ----------------------------- */

const unoDigital = (
  n: number,
  port: string,
  opts: { functions?: PinFunction[]; alt?: string[]; description?: string; notes?: string } = {},
): Pin => ({
  id: `D${n}`,
  number: `D${n}`,
  name: `D${n}`,
  alt: [port, ...(opts.alt ?? [])],
  functions: ["GPIO", ...(opts.functions ?? [])],
  direction: "bidirectional",
  description: opts.description ?? `Digital I/O (ATmega328P ${port}). Configure with pinMode(); internal 20–50 kΩ pull-up available.`,
  voltage: "0 / 5 V logic, 20 mA recommended (40 mA abs. max)",
  notes: opts.notes,
});

const unoAnalog = (n: number, extra: { functions?: PinFunction[]; alt?: string[]; description?: string } = {}): Pin => ({
  id: `A${n}`,
  number: `A${n}`,
  name: `A${n}`,
  alt: [`PC${n}`, `ADC${n}`, `D${14 + n}`, ...(extra.alt ?? [])],
  functions: ["ADC", "Analog", "GPIO", ...(extra.functions ?? [])],
  direction: "bidirectional",
  description:
    extra.description ??
    `10-bit analog input (analogRead → 0–1023 against AREF/5 V). Also usable as digital pin D${14 + n}.`,
  voltage: "0 – 5 V (do not exceed AREF when using external reference)",
});

const ARDUINO_UNO: Device = {
  id: "arduino-uno",
  name: "Arduino Uno",
  fullName: "Arduino Uno R3 (ATmega328P)",
  category: "Microcontroller Board",
  package: "Arduino Uno R3 headers",
  description:
    "The reference 5 V Arduino board built around the 8-bit AVR ATmega328P @ 16 MHz. 14 digital I/O (6 PWM), 6 analog inputs, UART, I²C and SPI.",
  specs: [
    { label: "MCU", value: "ATmega328P, 8-bit AVR @ 16 MHz" },
    { label: "Memory", value: "32 KB Flash, 2 KB SRAM, 1 KB EEPROM" },
    { label: "Logic level", value: "5 V" },
    { label: "Input voltage (VIN / jack)", value: "7 – 12 V recommended (6 – 20 V limit)" },
    { label: "I/O current", value: "20 mA recommended, 40 mA abs. max per pin, 200 mA total" },
    { label: "ADC", value: "6 channels, 10-bit" },
    { label: "PWM", value: "D3, D5, D6, D9, D10, D11 — 490 Hz (D5/D6 980 Hz)" },
  ],
  layout: {
    style: "board",
    left: ["IOREF", "RESET", "3V3", "5V", "GND1", "GND2", "VIN", "A0", "A1", "A2", "A3", "A4", "A5"],
    right: ["SCL", "SDA", "AREF", "GND3", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2", "D1", "D0"],
    leftLabel: "Power + Analog",
    rightLabel: "Digital",
  },
  pins: [
    {
      id: "IOREF",
      number: "IOREF",
      name: "IOREF",
      functions: ["VCC"],
      direction: "power",
      description: "Reports the board's I/O voltage (5 V on the Uno) so shields can adapt their level shifters.",
      voltage: "5 V",
    },
    {
      id: "RESET",
      number: "RESET",
      name: "RESET",
      alt: ["PC6"],
      functions: ["Reset"],
      direction: "input",
      description: "Active-low reset. Pull to GND to reset the microcontroller (same as the on-board button).",
      voltage: "5 V idle (10 kΩ pull-up), LOW = reset",
    },
    {
      id: "3V3",
      number: "3.3V",
      name: "3.3V",
      functions: ["VCC"],
      direction: "power",
      description: "3.3 V regulated output from the on-board LDO.",
      voltage: "3.3 V, 50 mA max",
    },
    {
      id: "5V",
      number: "5V",
      name: "5V",
      functions: ["VCC"],
      direction: "power",
      description: "Regulated 5 V rail (from USB or the on-board regulator). Can power small sensors.",
      voltage: "5 V, ≈ 400–500 mA (USB-limited)",
      notes: "Feeding 5 V here bypasses the regulator — do so only with a clean regulated supply.",
    },
    { id: "GND1", number: "GND", name: "GND", functions: ["GND"], direction: "ground", description: "Ground.", voltage: "0 V" },
    { id: "GND2", number: "GND", name: "GND", functions: ["GND"], direction: "ground", description: "Ground.", voltage: "0 V" },
    {
      id: "VIN",
      number: "VIN",
      name: "VIN",
      functions: ["VCC"],
      direction: "power",
      description: "Raw input voltage to the on-board regulator (same as the DC barrel jack, after the reverse-polarity diode).",
      voltage: "7 – 12 V recommended",
    },
    unoAnalog(0),
    unoAnalog(1),
    unoAnalog(2),
    unoAnalog(3),
    unoAnalog(4, {
      functions: ["I2C"],
      alt: ["SDA"],
      description: "10-bit analog input, also the I²C data line SDA (shared with the SDA header pin). Wire library.",
    }),
    unoAnalog(5, {
      functions: ["I2C"],
      alt: ["SCL"],
      description: "10-bit analog input, also the I²C clock line SCL (shared with the SCL header pin).",
    }),
    {
      id: "SCL",
      number: "SCL",
      name: "SCL",
      alt: ["PC5", "A5"],
      functions: ["I2C"],
      direction: "bidirectional",
      description: "I²C clock — internally the same signal as A5.",
      voltage: "5 V logic (open-drain, needs pull-up)",
    },
    {
      id: "SDA",
      number: "SDA",
      name: "SDA",
      alt: ["PC4", "A4"],
      functions: ["I2C"],
      direction: "bidirectional",
      description: "I²C data — internally the same signal as A4.",
      voltage: "5 V logic (open-drain, needs pull-up)",
    },
    {
      id: "AREF",
      number: "AREF",
      name: "AREF",
      functions: ["ADC", "Analog", "Input"],
      direction: "input",
      description: "External analog reference for the ADC. Select with analogReference(EXTERNAL) before applying a voltage.",
      voltage: "0 – 5 V (must not exceed 5 V)",
    },
    { id: "GND3", number: "GND", name: "GND", functions: ["GND"], direction: "ground", description: "Ground.", voltage: "0 V" },
    unoDigital(13, "PB5", {
      functions: ["SPI"],
      alt: ["SCK", "LED_BUILTIN"],
      description: "Digital I/O, SPI clock (SCK) and the on-board LED 'L'.",
    }),
    unoDigital(12, "PB4", { functions: ["SPI"], alt: ["MISO"], description: "Digital I/O, SPI MISO (master in, slave out)." }),
    unoDigital(11, "PB3", {
      functions: ["PWM", "SPI"],
      alt: ["MOSI", "OC2A"],
      description: "Digital I/O, PWM (Timer2, 490 Hz), SPI MOSI.",
    }),
    unoDigital(10, "PB2", {
      functions: ["PWM", "SPI"],
      alt: ["SS", "OC1B"],
      description: "Digital I/O, PWM (Timer1, 490 Hz), SPI slave-select (SS).",
      notes: "Must stay an OUTPUT when using the board as SPI master.",
    }),
    unoDigital(9, "PB1", { functions: ["PWM"], alt: ["OC1A"], description: "Digital I/O, PWM (Timer1, 490 Hz). Servo library uses Timer1." }),
    unoDigital(8, "PB0", { alt: ["ICP1", "CLKO"], description: "Digital I/O, Timer1 input capture (ICP1)." }),
    unoDigital(7, "PD7", { alt: ["AIN1"], description: "Digital I/O, analog comparator negative input (AIN1)." }),
    unoDigital(6, "PD6", { functions: ["PWM"], alt: ["OC0A", "AIN0"], description: "Digital I/O, PWM (Timer0, 980 Hz), analog comparator positive input." }),
    unoDigital(5, "PD5", { functions: ["PWM"], alt: ["OC0B", "T1"], description: "Digital I/O, PWM (Timer0, 980 Hz)." }),
    unoDigital(4, "PD4", { alt: ["T0", "XCK"], description: "Digital I/O, Timer0 external clock input." }),
    unoDigital(3, "PD3", {
      functions: ["PWM", "Interrupt"],
      alt: ["INT1", "OC2B"],
      description: "Digital I/O, PWM (Timer2, 490 Hz), external interrupt INT1.",
    }),
    unoDigital(2, "PD2", { functions: ["Interrupt"], alt: ["INT0"], description: "Digital I/O, external interrupt INT0 (attachInterrupt(0, …))." }),
    unoDigital(1, "PD1", {
      functions: ["UART"],
      alt: ["TX", "TXD"],
      description: "Digital I/O, UART transmit — shared with the USB-serial bridge.",
      notes: "Avoid using while uploading sketches or using Serial.",
    }),
    unoDigital(0, "PD0", {
      functions: ["UART"],
      alt: ["RX", "RXD"],
      description: "Digital I/O, UART receive — shared with the USB-serial bridge.",
      notes: "Avoid using while uploading sketches or using Serial.",
    }),
  ],
  notes: [
    "All I/O pins are 5 V; connect 3.3 V-only devices through a level shifter.",
    "The ICSP header duplicates D11–D13 (MOSI, MISO, SCK), RESET, 5 V and GND.",
    "analogWrite() on D3/D11 conflicts with tone(); D9/D10 conflict with the Servo library.",
  ],
  datasheetHint: "Arduino Uno Rev3 schematic & Microchip ATmega328P datasheet",
};

/* ---------------------------- ESP32 DevKit V1 --------------------------- */

const ESP_V = "3.3 V logic — NOT 5 V tolerant; 20 mA default drive (40 mA abs. max)";

const espGpio = (
  label: string,
  gpio: number,
  functions: PinFunction[],
  description: string,
  alt: string[] = [],
  notes?: string,
  direction: PinDirection = "bidirectional",
): Pin => ({
  id: label,
  number: label,
  name: `GPIO${gpio}`,
  alt: [label, ...alt],
  functions,
  direction,
  description,
  voltage: direction === "input" ? "0 – 3.3 V input only" : ESP_V,
  notes,
});

const ESP32_DEVKIT: Device = {
  id: "esp32-devkit-v1",
  name: "ESP32 DevKit V1",
  fullName: "ESP32 DevKit V1 (ESP-WROOM-32, 30-pin)",
  category: "Microcontroller Board",
  package: "30-pin DOIT DevKit V1",
  description:
    "Dual-core 240 MHz Xtensa LX6 with Wi-Fi and Bluetooth. Almost any output pin can be routed to PWM (LEDC), UART, I²C or SPI through the GPIO matrix; the mappings below are the common defaults.",
  specs: [
    { label: "SoC", value: "ESP32-D0WD, dual-core Xtensa LX6 @ 240 MHz" },
    { label: "Memory", value: "520 KB SRAM, 4 MB SPI flash" },
    { label: "Logic level", value: "3.3 V (not 5 V tolerant)" },
    { label: "Input voltage (VIN)", value: "5 V via USB/VIN (regulator accepts ≈ 4.5 – 12 V)" },
    { label: "ADC", value: "18 ch, 12-bit (ADC2 unavailable while Wi-Fi is on)" },
    { label: "DAC", value: "2 ch, 8-bit (GPIO25, GPIO26)" },
    { label: "PWM", value: "16 LEDC channels on any output-capable GPIO" },
    { label: "Touch", value: "10 capacitive touch inputs (9 broken out)" },
  ],
  layout: {
    style: "board",
    left: ["EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26", "D27", "D14", "D12", "D13", "GND_L", "VIN"],
    right: ["D23", "D22", "TX0", "RX0", "D21", "D19", "D18", "D5", "TX2", "RX2", "D4", "D2", "D15", "GND_R", "3V3"],
    leftLabel: "Left header (antenna up)",
    rightLabel: "Right header",
  },
  pins: [
    {
      id: "EN",
      number: "EN",
      name: "EN",
      alt: ["CHIP_PU", "RST"],
      functions: ["Reset", "Control"],
      direction: "input",
      description: "Chip enable (active-high). Pulling LOW resets the ESP32 — wired to the on-board EN button.",
      voltage: "3.3 V (pull-up), LOW = reset",
    },
    espGpio("VP", 36, ["ADC", "Input", "Analog"], "Input-only. ADC1_CH0 / SENSOR_VP. No internal pull-up/down.", ["ADC1_CH0", "SENSOR_VP"], undefined, "input"),
    espGpio("VN", 39, ["ADC", "Input", "Analog"], "Input-only. ADC1_CH3 / SENSOR_VN. No internal pull-up/down.", ["ADC1_CH3", "SENSOR_VN"], undefined, "input"),
    espGpio("D34", 34, ["ADC", "Input", "Analog"], "Input-only. ADC1_CH6. No internal pull-up/down.", ["ADC1_CH6"], undefined, "input"),
    espGpio("D35", 35, ["ADC", "Input", "Analog"], "Input-only. ADC1_CH7. No internal pull-up/down.", ["ADC1_CH7"], undefined, "input"),
    espGpio("D32", 32, ["GPIO", "PWM", "ADC", "Touch", "Analog"], "GPIO, ADC1_CH4, Touch9, 32 kHz crystal pin (XTAL_32K_P).", ["ADC1_CH4", "TOUCH9"]),
    espGpio("D33", 33, ["GPIO", "PWM", "ADC", "Touch", "Analog"], "GPIO, ADC1_CH5, Touch8, 32 kHz crystal pin (XTAL_32K_N).", ["ADC1_CH5", "TOUCH8"]),
    espGpio("D25", 25, ["GPIO", "PWM", "ADC", "DAC", "Analog"], "GPIO, DAC1 (8-bit true analog out), ADC2_CH8.", ["DAC1", "ADC2_CH8"], "ADC2 is unavailable while Wi-Fi is active."),
    espGpio("D26", 26, ["GPIO", "PWM", "ADC", "DAC", "Analog"], "GPIO, DAC2 (8-bit true analog out), ADC2_CH9.", ["DAC2", "ADC2_CH9"], "ADC2 is unavailable while Wi-Fi is active."),
    espGpio("D27", 27, ["GPIO", "PWM", "ADC", "Touch", "Analog"], "GPIO, ADC2_CH7, Touch7.", ["ADC2_CH7", "TOUCH7"], "ADC2 is unavailable while Wi-Fi is active."),
    espGpio("D14", 14, ["GPIO", "PWM", "ADC", "Touch", "SPI", "Analog"], "GPIO, ADC2_CH6, Touch6, HSPI CLK.", ["ADC2_CH6", "TOUCH6", "HSPI_CLK"], "Outputs a PWM signal at boot."),
    espGpio(
      "D12",
      12,
      ["GPIO", "PWM", "ADC", "Touch", "SPI", "Strapping", "Analog"],
      "GPIO, ADC2_CH5, Touch5, HSPI MISO. Strapping pin MTDI (selects flash voltage).",
      ["ADC2_CH5", "TOUCH5", "HSPI_MISO", "MTDI"],
      "Must be LOW at boot — a pull-up here makes boot fail on 3.3 V flash modules.",
    ),
    espGpio("D13", 13, ["GPIO", "PWM", "ADC", "Touch", "SPI", "Analog"], "GPIO, ADC2_CH4, Touch4, HSPI MOSI.", ["ADC2_CH4", "TOUCH4", "HSPI_MOSI"]),
    { id: "GND_L", number: "GND", name: "GND", functions: ["GND"], direction: "ground", description: "Ground.", voltage: "0 V" },
    {
      id: "VIN",
      number: "VIN",
      name: "VIN",
      alt: ["5V"],
      functions: ["VCC"],
      direction: "power",
      description: "5 V input to the on-board AMS1117 3.3 V regulator (also connected to USB 5 V through a diode).",
      voltage: "5 V nominal (≈ 4.5 – 12 V)",
    },
    espGpio("D23", 23, ["GPIO", "PWM", "SPI"], "GPIO, VSPI MOSI (default SPI MOSI).", ["VSPI_MOSI", "MOSI"]),
    espGpio("D22", 22, ["GPIO", "PWM", "I2C"], "GPIO, default I²C SCL (Wire).", ["SCL", "VSPI_WP"]),
    espGpio(
      "TX0",
      1,
      ["GPIO", "UART"],
      "UART0 TX — connected to the USB-serial bridge (Serial / programming).",
      ["U0TXD", "TX"],
      "Outputs boot log; avoid using as GPIO.",
    ),
    espGpio(
      "RX0",
      3,
      ["GPIO", "UART"],
      "UART0 RX — connected to the USB-serial bridge (Serial / programming).",
      ["U0RXD", "RX"],
      "HIGH at boot; avoid using as GPIO.",
    ),
    espGpio("D21", 21, ["GPIO", "PWM", "I2C"], "GPIO, default I²C SDA (Wire).", ["SDA", "VSPI_HD"]),
    espGpio("D19", 19, ["GPIO", "PWM", "SPI"], "GPIO, VSPI MISO (default SPI MISO).", ["VSPI_MISO", "MISO"]),
    espGpio("D18", 18, ["GPIO", "PWM", "SPI"], "GPIO, VSPI CLK (default SPI SCK).", ["VSPI_CLK", "SCK"]),
    espGpio(
      "D5",
      5,
      ["GPIO", "PWM", "SPI", "Strapping"],
      "GPIO, VSPI CS (default SPI SS). Strapping pin (SDIO slave timing).",
      ["VSPI_CS0", "SS"],
      "Outputs PWM at boot; must be HIGH during boot.",
    ),
    espGpio("TX2", 17, ["GPIO", "PWM", "UART"], "GPIO, UART2 TX (Serial2).", ["U2TXD", "GPIO17"]),
    espGpio("RX2", 16, ["GPIO", "PWM", "UART"], "GPIO, UART2 RX (Serial2).", ["U2RXD", "GPIO16"]),
    espGpio("D4", 4, ["GPIO", "PWM", "ADC", "Touch", "Analog"], "GPIO, ADC2_CH0, Touch0.", ["ADC2_CH0", "TOUCH0"], "ADC2 is unavailable while Wi-Fi is active."),
    espGpio(
      "D2",
      2,
      ["GPIO", "PWM", "ADC", "Touch", "Strapping", "Analog"],
      "GPIO, ADC2_CH2, Touch2, on-board blue LED. Strapping pin for boot mode.",
      ["ADC2_CH2", "TOUCH2", "LED_BUILTIN"],
      "Must be LOW or floating to enter the serial bootloader.",
    ),
    espGpio(
      "D15",
      15,
      ["GPIO", "PWM", "ADC", "Touch", "SPI", "Strapping", "Analog"],
      "GPIO, ADC2_CH3, Touch3, HSPI CS. Strapping pin MTDO (LOW silences boot log).",
      ["ADC2_CH3", "TOUCH3", "HSPI_CS0", "MTDO"],
      "Outputs PWM at boot.",
    ),
    { id: "GND_R", number: "GND", name: "GND", functions: ["GND"], direction: "ground", description: "Ground.", voltage: "0 V" },
    {
      id: "3V3",
      number: "3V3",
      name: "3V3",
      functions: ["VCC"],
      direction: "power",
      description: "3.3 V regulated output (from the AMS1117). Can also be used to feed a regulated 3.3 V supply.",
      voltage: "3.3 V, ≈ 600 mA shared with the ESP32 (Wi-Fi peaks ≈ 250 mA)",
    },
  ],
  notes: [
    "GPIO 34–39 are input-only and have no internal pull resistors.",
    "GPIO 6–11 are wired to the SPI flash and are not broken out — never use them.",
    "ADC2 channels cannot be read while Wi-Fi is running; prefer ADC1 (GPIO 32–39) for sensors.",
    "ESP32 ADC is noticeably non-linear near 0 V and 3.3 V — calibrate or use the esp_adc_cal API.",
  ],
  datasheetHint: "Espressif ESP32 Series datasheet & ESP32-WROOM-32 datasheet",
};

export const DEVICES: Device[] = [NE555, LM741, ARDUINO_UNO, ESP32_DEVKIT];

export const ALL_PIN_FUNCTIONS: PinFunction[] = [
  "VCC",
  "GND",
  "GPIO",
  "PWM",
  "ADC",
  "DAC",
  "I2C",
  "SPI",
  "UART",
  "Touch",
  "Interrupt",
  "Input",
  "Output",
  "Analog",
  "Control",
  "Reset",
  "Strapping",
  "NC",
];

/** Tailwind classes per pin function (chips + diagram highlights). */
export const FUNCTION_STYLES: Record<PinFunction, string> = {
  VCC: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  GND: "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  GPIO: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  PWM: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  ADC: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  DAC: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  I2C: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  SPI: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  UART: "border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300",
  Touch: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  Interrupt: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  Input: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Output: "border-lime-500/40 bg-lime-500/10 text-lime-700 dark:text-lime-300",
  Analog: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  Control: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  Reset: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Strapping: "border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-300",
  NC: "border-zinc-400/40 bg-zinc-400/10 text-zinc-500 dark:text-zinc-400",
};

/** Solid fill colours for SVG pin markers, keyed by primary pin role. */
export const PIN_FILL: Record<PinDirection, string> = {
  power: "#ef4444",
  ground: "#64748b",
  input: "#06b6d4",
  output: "#84cc16",
  bidirectional: "#3b82f6",
  nc: "#a1a1aa",
};
