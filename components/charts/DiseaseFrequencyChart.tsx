"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { HeartPulse } from "lucide-react";
import ChartTooltip from "./ChartTooltip";

interface DataPoint {
  condition_name: string;
  count: number;
}

interface DiseaseFrequencyChartProps {
  data: DataPoint[];
}

export default function DiseaseFrequencyChart({
  data,
}: DiseaseFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center py-12">
        <HeartPulse className="w-10 h-10 text-muted/40 mb-3" />
        <p className="text-sm text-muted">No disease records yet</p>
        <p className="text-xs text-muted/60 mt-1">
          Health events will appear here once logged
        </p>
      </div>
    );
  }

  return (
    <div className="card h-full">
      <h3 className="font-display text-lg font-semibold mb-4">
        Disease Frequency
      </h3>
      <div className="h-[240px] sm:h-[260px] lg:h-[300px] xl:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <defs>
              <linearGradient id="diseaseGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1c3829" />
                <stop offset="100%" stopColor="#4a8260" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e0d2"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "#6b7564" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="condition_name"
              tick={{ fontSize: 12, fill: "#6b7564" }}
              axisLine={false}
              tickLine={false}
              width={120}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueLabel="Cases"
                  valueFormatter={(v) => String(v)}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="url(#diseaseGradient)"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
