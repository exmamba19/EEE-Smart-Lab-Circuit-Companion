import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS } from "@/data/tools";

export default function ToolCards() {
  const tools = TOOLS.filter((t) => t.id !== "dashboard");
  return (
    <section aria-labelledby="tools-title">
      <h2 id="tools-title" className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        Tools
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md dark:hover:border-cyan-500/50"
            >
              <div className="flex items-start justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.accent}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-cyan-500 dark:text-slate-600" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{tool.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500 dark:text-slate-400">{tool.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="chip border-slate-200 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">{tool.group}</span>
                {tool.tags.map((t) => (
                  <span key={t} className="chip border-slate-200 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
