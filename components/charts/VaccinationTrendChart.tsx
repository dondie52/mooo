"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { Syringe } from "lucide-react";
import ChartTooltip from "./ChartTooltip";

interface DataPoint {
  month: string;
  coverage_pct: number;
}

interface VaccinationTrendChartProps {
  data: DataPoint[];
}

export default function VaccinationTrendChart({
  data,
}: VaccinationTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center py-12">
        <Syringe className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-sm text-muted">No data yet</p>
        <p className="text-xs text-muted/60 mt-1">
          Log your first vaccination to see trends
        </p>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <h3 className="font-display text-lg font-semibold mb-4">
        Vaccination Coverage Trend
      </h3>
      <div className="h-[240px] sm:h-[260px] lg:h-[300px] xl:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d2" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6b7564" }}
              axisLine={{ stroke: "#e5e0d2" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7564" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueLabel="Coverage"
                  valueFormatter={(v) => `${v}%`}
                />
              }
            />
            <ReferenceLine
              y={80}
              stroke="#c0392b"
              strokeDasharray="6 4"
              label={{
                value: "Minimum (80%)",
                position: "insideTopRight",
                fill: "#c0392b",
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="coverage_pct"
              stroke="#1c3829"
              strokeWidth={2.5}
              dot={{ fill: "#c8861a", strokeWidth: 0, r: 4 }}
              activeDot={{ fill: "#c8861a", strokeWidth: 2, stroke: "#fff", r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
