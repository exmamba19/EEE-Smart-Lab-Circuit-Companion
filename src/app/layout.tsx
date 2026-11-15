import type { Metadata, Viewport } from "next";
import AppShell from "@/components/layout/AppShell";
import { themeInitScript } from "@/components/layout/themeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EEE Smart Lab & Circuit Companion",
    template: "%s · EEE Smart Lab",
  },
  description:
    "Calculators, component decoders, IC/MCU pinouts and a V-I lab data plotter for Electrical & Electronic Engineering students and engineers.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
