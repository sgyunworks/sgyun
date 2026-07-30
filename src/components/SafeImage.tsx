"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SafeImageProps = Omit<ImageProps, "onError"> & {
  fallbackLabel?: string;
};

export function SafeImage({
  alt,
  className,
  fallbackLabel,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const sourceMissing =
    typeof props.src === "string" ? props.src.trim().length === 0 : !props.src;

  if (sourceMissing || failed) {
    const altLabel = typeof alt === "string" ? alt : "";
    const label = sourceMissing
      ? altLabel || "Media pending"
      : fallbackLabel || altLabel || "Media unavailable";
    return (
      <span
        className={`media-fallback${className ? ` ${className}` : ""}`}
        role={alt ? "img" : undefined}
        aria-label={alt ? label : undefined}
        aria-hidden={alt ? undefined : true}
      >
        <small>{sourceMissing ? "MEDIA_PENDING" : "MEDIA_UNAVAILABLE"}</small>
        <span>{label}</span>
      </span>
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
