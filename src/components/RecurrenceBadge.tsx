export function RecurrenceBadge({
  isFixed,
  installmentNumber,
  installmentTotal,
}: {
  isFixed: boolean;
  installmentNumber: number | null;
  installmentTotal: number | null;
}) {
  if (isFixed) {
    return (
      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
        Fixa
      </span>
    );
  }

  if (installmentNumber && installmentTotal) {
    return (
      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
        {installmentNumber}/{installmentTotal}
      </span>
    );
  }

  return null;
}
