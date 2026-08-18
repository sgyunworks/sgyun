import type { ReactNode } from "react";
import styles from "./IPhone17ProMockup.module.css";

export function IPhone17ProMockup({
  children,
  className = "",
  screenClassName = "",
}: {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
}) {
  return (
    <div className={`${styles.device} ${className}`}>
      <div className={`${styles.screen} ${screenClassName}`}>{children}</div>
      <svg
        className={styles.bezel}
        viewBox="0 0 1350 2760"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <image
          href="/images/recopick/iphone-17-pro-deep-blue-portrait.png"
          width="1350"
          height="2760"
          preserveAspectRatio="none"
        />
      </svg>
    </div>
  );
}
