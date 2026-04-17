"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useTheme } from "@/components/theme-provider";
import type { CategoryStat } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  code_review: "Code Review",
  system_design: "System Design",
  debugging: "Debugging",
  data_analysis: "Data Analysis",
  practical_coding: "Practical Coding",
  cfa: "CFA",
};

interface CategoryRadarChartProps {
  data: CategoryStat[];
}

export function CategoryRadarChart({ data }: CategoryRadarChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const gridColor = isDark ? "oklch(0.3 0 0 / 0.4)" : "oklch(0.85 0 0)";
  const labelColor = isDark ? "oklch(0.6 0 0)" : "oklch(0.4 0 0)";
  const tickColor = isDark ? "oklch(0.45 0 0)" : "oklch(0.55 0 0)";
  const radarStroke = isDark ? "oklch(0.7 0.15 270)" : "oklch(0.5 0.18 270)";
  const radarFill = isDark ? "oklch(0.7 0.15 270)" : "oklch(0.5 0.18 270)";

  const allCategories = [
    "code_review",
    "system_design",
    "debugging",
    "data_analysis",
    "practical_coding",
    "cfa",
  ];

  const radarData = allCategories.map((cat) => {
    const stat = data.find((d) => d.category === cat);
    return {
      category: CATEGORY_LABELS[cat] ?? cat,
      score: stat?.avgScore ?? 0,
      sessions: stat?.sessionCount ?? 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke={gridColor} />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: labelColor }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: tickColor }}
          tickCount={5}
          stroke={gridColor}
        />
        <Radar
          dataKey="score"
          stroke={radarStroke}
          fill={radarFill}
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
