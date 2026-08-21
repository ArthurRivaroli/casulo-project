"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

const POSITIVE_COLOR = "#059669";
const NEGATIVE_COLOR = "#dc2626";

type Item = { label: string; net: number };

export function MonthlyBalanceChart({ data }: { data: Item[] }) {
  return (
    <div className="text-zinc-500 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "currentColor" }}
          />
          <YAxis hide />
          <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.25} />
          <Tooltip
            content={ChartTooltip}
            cursor={{ fill: "currentColor", opacity: 0.05 }}
          />
          <Bar dataKey="net" radius={[4, 4, 4, 4]} maxBarSize={24}>
            {data.map((entry) => (
              <Cell
                key={entry.label}
                fill={entry.net >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
