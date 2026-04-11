"use client";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
  valueLabel?: string;
  valueFormatter?: (value: number) => string;
}

export default function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "Value",
  valueFormatter = (v) => String(v),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];

  return (
    <div className="bg-white rounded-xl border border-border shadow-card-hover px-4 py-3 min-w-[120px]">
      {label && (
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
          {label}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.color ?? "#c8861a" }}
        />
        <span className="font-display text-lg font-semibold text-forest-deep leading-none">
          {valueFormatter(item.value)}
        </span>
        <span className="text-xs text-muted">{valueLabel}</span>
      </div>
    </div>
  );
}
