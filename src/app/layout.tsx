import type { Metadata, Viewport } from "next";
import AppShell from "@/components/layout/AppShell";
import { themeInitScript } from "@/components/layout/themeScript";
import "./globals.css";

const APP_NAME = "EEE Smart Lab & Circuit Companion";
const APP_SHORT_NAME = "EEE Lab";
const APP_DESCRIPTION =
  "Calculators, component decoders, IC/MCU pinouts and a V-I lab data plotter for Electrical & Electronic Engineering students and engineers.";

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to the deployed origin so Open Graph image URLs are absolute.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: "%s · EEE Smart Lab",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.json",
  keywords: ["EEE", "electronics", "Ohm's law", "resistor color code", "SMD", "pinout", "op-amp", "RC filter", "V-I characteristic"],
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512 }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#0891b2",
    "msapplication-TileImage": "/icons/icon-144x144.png",
    "msapplication-tap-highlight": "no",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
