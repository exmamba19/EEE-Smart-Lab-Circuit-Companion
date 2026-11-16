import {
  Binary,
  ChartLine,
  CircuitBoard,
  Cpu,
  LayoutDashboard,
  PlugZap,
  Microchip,
  Triangle,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ToolGroup = "Overview" | "Calculators" | "Lab Tools";

export interface ToolDef {
  id: string;
  title: string;
  short: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: ToolGroup;
  /** Tailwind classes for the accent icon tile. */
  accent: string;
  tags: string[];
}

export const TOOLS: ToolDef[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    short: "Dashboard",
    description: "Quick access to every tool and a searchable formula cheat sheet.",
    href: "/",
    icon: LayoutDashboard,
    group: "Overview",
    accent: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    tags: [],
  },
  {
    id: "ohms-law",
    title: "Ohm's Law & Power",
    short: "Ohm's Law",
    description: "Enter any two of V, I, R, P and the other two are solved instantly.",
    href: "/calculators/ohms-law",
    icon: Zap,
    group: "Calculators",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tags: ["V = IR", "P = VI"],
  },
  {
    id: "rc-rlc",
    title: "RC / RLC Filter & Transient",
    short: "RC / RLC",
    description: "Time constant τ, cutoff frequency fc, resonance fr, Q-factor and step response.",
    href: "/calculators/rc-rlc",
    icon: Waves,
    group: "Calculators",
    accent: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    tags: ["τ = RC", "fc", "fr"],
  },
  {
    id: "op-amp",
    title: "Op-Amp Gain",
    short: "Op-Amp Gain",
    description: "Inverting and non-inverting amplifier gain, dB gain and output voltage with rail clipping.",
    href: "/calculators/op-amp",
    icon: Triangle,
    group: "Calculators",
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    tags: ["Av", "dB"],
  },
  {
    id: "power-machines",
    title: "Power Systems & Machines",
    short: "Power & Machines",
    description: "3-phase star/delta P, Q, S and PF correction, transformer ratio & efficiency, induction motor speed and slip.",
    href: "/calculators/power-machines",
    icon: PlugZap,
    group: "Calculators",
    accent: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    tags: ["3-phase", "kVAR", "Slip"],
  },
  {
    id: "resistor-decoder",
    title: "Resistor & SMD Decoder",
    short: "Resistor Decoder",
    description: "4/5-band colour code with a live resistor preview, plus SMD code decoding (103, 4R7, 01C).",
    href: "/tools/resistor-decoder",
    icon: CircuitBoard,
    group: "Lab Tools",
    accent: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    tags: ["Colour code", "SMD", "EIA-96"],
  },
  {
    id: "component-decoders",
    title: "Component Decoders & 555 Designer",
    short: "Components & 555",
    description: "Capacitor codes (104 → 100 nF), inductor colour bands, 555 astable/monostable designer, LED resistor and voltage divider.",
    href: "/tools/component-decoders",
    icon: Microchip,
    group: "Lab Tools",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    tags: ["104", "555", "LED"],
  },
  {
    id: "digital-logic",
    title: "Digital Logic & Number Systems",
    short: "Digital Logic",
    description: "Interactive AND/OR/NOT/NAND/NOR/XOR/XNOR simulator with live truth tables, plus binary/octal/hex/2's-complement converter.",
    href: "/tools/digital-logic",
    icon: Binary,
    group: "Lab Tools",
    accent: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    tags: ["Gates", "Truth table", "Hex"],
  },
  {
    id: "pinouts",
    title: "IC & MCU Pinouts",
    short: "Pinout Reference",
    description: "NE555, LM741, Arduino Uno and ESP32 DevKit pinouts with search and function filters.",
    href: "/tools/pinouts",
    icon: Cpu,
    group: "Lab Tools",
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    tags: ["PWM", "ADC", "I2C"],
  },
  {
    id: "lab-plotter",
    title: "Lab Data Logger & V-I Plotter",
    short: "V-I Plotter",
    description: "Log V-I readings, plot the characteristic curve, compute ΔV/ΔI and export CSV.",
    href: "/tools/lab-plotter",
    icon: ChartLine,
    group: "Lab Tools",
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    tags: ["Recharts", "CSV"],
  },
];

export const TOOL_GROUPS: ToolGroup[] = ["Overview", "Calculators", "Lab Tools"];

export const toolById = (id: string) => TOOLS.find((t) => t.id === id);
