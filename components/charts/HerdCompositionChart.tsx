"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Beef } from "lucide-react";
import ChartTooltip from "./ChartTooltip";

interface DataPoint {
  breed: string;
  count: number;
}

interface HerdCompositionChartProps {
  data: DataPoint[];
}

const COLORS = [
  "#1c3829", // forest-mid
  "#4a8260", // forest-accent
  "#c8861a", // gold
  "#2d5840", // forest-light
  "#e8a93d", // gold-light
  "#9c6510", // gold-dark
  "#3a7d4c", // alert-green
  "#6b7564", // muted
];

export default function HerdCompositionChart({
  data,
}: HerdCompositionChartProps) {
  if (data.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center py-12">
        <Beef className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-sm text-muted">No herd data yet</p>
        <p className="text-xs text-muted/60 mt-1">
          Register animals to see your herd composition
        </p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="card h-full">
      <h3 className="font-display text-lg font-semibold mb-4">
        Herd Composition
      </h3>
      <div className="h-[200px] sm:h-[220px] lg:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="breed"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={
                <ChartTooltip
                  valueLabel="Head"
                  valueFormatter={(v) => String(v)}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Custom legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {data.map((d, i) => (
          <div key={d.breed} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-xs text-muted">
              {d.breed}{" "}
              <span className="font-semibold text-forest-deep">
                {d.count}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
