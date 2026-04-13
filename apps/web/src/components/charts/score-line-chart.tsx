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
import { useTheme } from "@/components/theme-provider";
import type { ScoreTrendPoint } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  code_review: "oklch(0.55 0.18 250)",
  system_design: "oklch(0.55 0.16 280)",
  debugging: "oklch(0.6 0.18 45)",
  data_analysis: "oklch(0.55 0.16 160)",
  practical_coding: "oklch(0.55 0.18 350)",
};

interface ScoreLineChartProps {
  data: ScoreTrendPoint[];
}

export function ScoreLineChart({ data }: ScoreLineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "oklch(0.3 0 0 / 0.4)" : "oklch(0.85 0 0)";
  const axisColor = isDark ? "oklch(0.5 0 0)" : "oklch(0.45 0 0)";
  const primaryStroke = isDark ? "oklch(0.7 0.15 270)" : "oklch(0.5 0.18 270)";
  const tooltipBg = isDark ? "oklch(0.18 0 0)" : "oklch(0.98 0 0)";
  const tooltipBorder = isDark ? "oklch(0.3 0 0)" : "oklch(0.88 0 0)";
  const tooltipLabel = isDark ? "oklch(0.65 0 0)" : "oklch(0.45 0 0)";

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
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: axisColor }}
          stroke={axisColor}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: axisColor }}
          stroke={axisColor}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
            boxShadow: "0 4px 12px oklch(0 0 0 / 0.15)",
          }}
          labelStyle={{ color: tooltipLabel }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, _name: any, props: any) => [
            `${value}`,
            props?.payload?.category?.replace("_", " ") ?? "",
          ]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke={primaryStroke}
          strokeWidth={2.5}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dot={(props: any) => (
            <circle
              key={props.payload?.sessionId ?? props.index}
              cx={props.cx ?? 0}
              cy={props.cy ?? 0}
              r={4}
              fill={CATEGORY_COLORS[props.payload?.category] ?? primaryStroke}
              stroke={tooltipBg}
              strokeWidth={2}
            />
          )}
          activeDot={{ r: 6, stroke: primaryStroke, strokeWidth: 2, fill: tooltipBg }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
