"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MouseEvent, useRef } from "react";
import styles from "./VaultAction.module.css";

export function VaultAction({
  href,
  label,
  code = "OPEN",
  className,
}: {
  href: string;
  label: string;
  code?: string;
  className?: string;
}) {
  const router = useRouter();
  const transitioningRef = useRef(false);

  const openVault = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.dataset.vaultTransition = "closing";

    window.setTimeout(() => router.push(href), reduceMotion ? 90 : 520);
    window.setTimeout(() => {
      if (root.dataset.vaultTransition === "closing") {
        root.dataset.vaultTransition = "opening";
        window.setTimeout(() => delete root.dataset.vaultTransition, 180);
      }
      transitioningRef.current = false;
    }, 2400);
  };

  return (
    <Link
      href={href}
      className={`${styles.action}${className ? ` ${className}` : ""}`}
      onClick={openVault}
    >
      <span className={styles.axis} aria-hidden="true">
        <i />
      </span>
      <span className={styles.copy}>
        <small>{code}</small>
        <strong>{label}</strong>
      </span>
      <span className={styles.latch} aria-hidden="true">
        <i />
      </span>
    </Link>
  );
}
