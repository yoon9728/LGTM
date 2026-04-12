"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ScoreTrendPoint } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  code_review: "oklch(0.65 0.19 145)",
  system_design: "oklch(0.65 0.19 250)",
  debugging: "oklch(0.65 0.19 30)",
  data_analysis: "oklch(0.65 0.19 300)",
  practical_coding: "oklch(0.65 0.19 60)",
};

interface ScoreLineChartProps {
  data: ScoreTrendPoint[];
}

export function ScoreLineChart({ data }: ScoreLineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0 0 / 0.15)" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11 }}
          stroke="oklch(0.55 0 0)"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          stroke="oklch(0.55 0 0)"
        />
        <Tooltip
          contentStyle={{
            background: "oklch(0.15 0 0)",
            border: "1px solid oklch(0.3 0 0)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "oklch(0.7 0 0)" }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) => [
            `${value}점`,
            props?.payload?.category?.replace("_", " ") ?? "",
          ]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="oklch(0.65 0.19 250)"
          strokeWidth={2}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dot={(props: any) => (
            <circle
              key={props.payload?.sessionId ?? props.index}
              cx={props.cx ?? 0}
              cy={props.cy ?? 0}
              r={4}
              fill={CATEGORY_COLORS[props.payload?.category] ?? "oklch(0.65 0.19 250)"}
              stroke="none"
            />
          )}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
