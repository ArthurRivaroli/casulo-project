"use client";

import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency } from "@/lib/formatCurrency";

export function ChartTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {label && (
        <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
      )}
      {payload.map((entry, index) => (
        <p key={index} className="text-zinc-600 dark:text-zinc-300">
          {formatCurrency(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}
