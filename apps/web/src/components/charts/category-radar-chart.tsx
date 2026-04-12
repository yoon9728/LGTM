"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { CategoryStat } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  code_review: "Code Review",
  system_design: "System Design",
  debugging: "Debugging",
  data_analysis: "Data Analysis",
  practical_coding: "Practical Coding",
};

interface CategoryRadarChartProps {
  data: CategoryStat[];
}

export function CategoryRadarChart({ data }: CategoryRadarChartProps) {
  // Ensure all 5 categories are present (even if 0)
  const allCategories = [
    "code_review",
    "system_design",
    "debugging",
    "data_analysis",
    "practical_coding",
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
        <PolarGrid stroke="oklch(0.4 0 0 / 0.2)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "oklch(0.6 0 0)" }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: "oklch(0.5 0 0)" }}
          tickCount={5}
        />
        <Radar
          dataKey="score"
          stroke="oklch(0.65 0.19 250)"
          fill="oklch(0.65 0.19 250)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
