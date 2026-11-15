import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { TOOLS } from "@/data/tools";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="card mx-auto mt-8 max-w-lg p-8 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <WifiOff className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        This page isn&apos;t available offline yet. Every tool below is stored on your device and works without a connection.
      </p>
      <ul className="mt-6 grid gap-2 text-left sm:grid-cols-2">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.id}>
              <Link href={t.href} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-cyan-400 dark:border-slate-800">
                <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                {t.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
