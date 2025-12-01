/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { UsageDay } from "@/lib/dashboard-stats";

interface UsageChartProps {
  data: UsageDay[];
}

export function UsageChart({ data }: UsageChartProps) {
  if (!data.length) {
    return (
      <p className="text-xs text-slate-500">
        Pas encore de trafic API enregistré sur les 7 derniers jours.
      </p>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={formatted} margin={{ left: 0, right: 12, top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: any, name: string) => {
              if (name === "requests") return [value, "Requêtes"];
              if (name === "billableRequests")
                return [value, "Requêtes facturables"];
              return [value, name];
            }}
            labelFormatter={(label: string) => label}
          />
          <Area
            type="monotone"
            dataKey="requests"
            name="Requêtes"
            stroke="#2563eb"
            fill="#bfdbfe"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
          <Area
            type="monotone"
            dataKey="billableRequests"
            name="Requêtes facturables"
            stroke="#16a34a"
            fill="#bbf7d0"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
