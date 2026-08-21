"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/formatCurrency";
import { ChartTooltip } from "./ChartTooltip";

type Item = { name: string; color: string; value: number };

export function ExpenseByCategoryChart({ data }: { data: Item[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-40 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        Nenhuma despesa este mês.
      </p>
    );
  }

  return (
    <div className="text-zinc-500 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "currentColor" }}
          />
          <Tooltip
            content={ChartTooltip}
            cursor={{ fill: "currentColor", opacity: 0.05 }}
          />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            label={{
              position: "right",
              formatter: (value: unknown) => formatCurrency(Number(value)),
              fontSize: 12,
              fill: "currentColor",
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
