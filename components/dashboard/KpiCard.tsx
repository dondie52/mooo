import Link from "next/link";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: string;
  variant?: "default" | "warning" | "danger";
  /** When set, the whole card links to this route (dashboard → section pages). */
  href?: string;
}

export default function KpiCard({
  label,
  value,
  sublabel,
  trend,
  variant = "default",
  href,
}: KpiCardProps) {
  const className = cn(
    "card block h-full transition-shadow",
    href && "card-hover cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-accent",
    variant === "warning" && "border-l-4 border-l-gold",
    variant === "danger" && "border-l-4 border-l-alert-red"
  );

  const inner = (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
        {label}
      </div>
      <div className="font-display text-4xl font-semibold text-forest-deep leading-none mb-1">
        {value}
      </div>
      {(sublabel || trend) && (
        <div className="flex items-center gap-2 mt-2">
          {sublabel && (
            <span className="text-xs text-muted">{sublabel}</span>
          )}
          {trend && (
            <span className="text-xs font-medium text-forest-accent">
              {trend}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
