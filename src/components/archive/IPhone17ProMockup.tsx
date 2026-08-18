import { useId, type ReactNode } from "react";
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
  const maskId = `iphone-frame-${useId().replaceAll(":", "")}`;
  const sensorMaskId = `iphone-sensors-${useId().replaceAll(":", "")}`;

  return (
    <div className={`${styles.device} ${className}`}>
      <div className={`${styles.screen} ${screenClassName}`}>{children}</div>
      <svg
        className={styles.bezel}
        viewBox="0 0 1350 2760"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width="1350" height="2760" fill="white" />
            <rect x="72" y="69" width="1206" height="2622" rx="130" fill="black" />
          </mask>
          <mask id={sensorMaskId} maskUnits="userSpaceOnUse">
            <rect width="1350" height="2760" fill="black" />
            <rect x="496" y="119" width="240" height="84" rx="42" fill="white" />
            <circle cx="810" cy="161" r="49" fill="white" />
          </mask>
        </defs>
        <image
          href="/images/recopick/iphone-17-pro-deep-blue-portrait.png"
          width="1350"
          height="2760"
          preserveAspectRatio="none"
          mask={`url(#${maskId})`}
        />
        <image
          href="/images/recopick/iphone-17-pro-deep-blue-portrait.png"
          width="1350"
          height="2760"
          preserveAspectRatio="none"
          mask={`url(#${sensorMaskId})`}
        />
      </svg>
    </div>
  );
}
