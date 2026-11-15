type Cell = string | number | null | undefined;

const escapeCell = (cell: Cell): string => {
  if (cell === null || cell === undefined) return "";
  const s = typeof cell === "number" ? (Number.isFinite(cell) ? String(cell) : "") : cell;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Serialise a header row + data rows into RFC-4180 CSV. */
export function toCSV(headers: string[], rows: Cell[][]): string {
  return [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

/** Trigger a browser download for a CSV string. */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
