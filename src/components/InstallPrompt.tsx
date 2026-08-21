"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "casulo-install-prompt-dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // One-time mount check against browser-only APIs (navigator/window/
    // localStorage aren't available during SSR, so this can't be an
    // initializer) — not a subscription, so there's no cascading update.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(isIOS && !isStandalone && !dismissed);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
      <p>
        Instale o Casulo: toque em <span aria-hidden>⎋</span> Compartilhar e
        depois em &quot;Adicionar à Tela de Início&quot;.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
      >
        Dispensar
      </button>
    </div>
  );
}
