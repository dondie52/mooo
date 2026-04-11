import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function daysFromNow(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return differenceInDays(d, new Date());
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-BW").format(n);
}

export function formatPercent(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)}%`;
}

export function vaccinationStatus(nextDue: string | null): {
  label: string;
  className: string;
} {
  if (!nextDue) return { label: "No schedule", className: "badge-muted" };
  const days = daysFromNow(nextDue);
  if (days < 0) return { label: "Overdue", className: "badge-red" };
  if (days <= 14) return { label: "Due soon", className: "badge-amber" };
  return { label: "Compliant", className: "badge-green" };
}
