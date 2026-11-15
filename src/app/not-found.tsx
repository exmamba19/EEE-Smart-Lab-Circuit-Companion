import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-12 max-w-md p-8 text-center">
      <p className="font-mono text-4xl font-bold text-cyan-600">404</p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Open circuit — this page does not exist.</p>
      <Link href="/" className="btn btn-primary mt-6">Back to dashboard</Link>
    </div>
  );
}
