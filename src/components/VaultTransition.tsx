"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const OPEN_DURATION_MS = 680;

export function VaultTransition() {
  const pathname = usePathname();
  const initialPathRef = useRef(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (initialPathRef.current === pathname) {
      if (root.dataset.vaultTransition !== "closing") {
        delete root.dataset.vaultTransition;
      }
      return;
    }

    initialPathRef.current = pathname;
    root.dataset.vaultTransition = "opening";
    const timer = window.setTimeout(() => {
      if (root.dataset.vaultTransition === "opening") {
        delete root.dataset.vaultTransition;
      }
    }, OPEN_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="vault-transition" aria-hidden="true">
      <span className="vault-transition__panel vault-transition__panel--left" />
      <span className="vault-transition__panel vault-transition__panel--right" />
      <span className="vault-transition__lock">
        <i />
      </span>
    </div>
  );
}
