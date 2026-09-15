"use client";

import { useState } from "react";

/**
 * Renders an image, or a labeled placeholder box when the URL is empty or
 * fails to load — so missing photography is always visibly named.
 */
export function ImgOrSlot({
  src,
  alt,
  slotName,
  slotNum,
  className,
  slotClassName = "thumb-slot",
}: {
  src: string;
  alt: string;
  slotName: string;
  slotNum?: string;
  className?: string;
  slotClassName?: string;
  showBadge?: boolean;
}) {
  const [ok, setOk] = useState(src.length > 0);

  if (!ok) {
    return (
      <div className={slotClassName}>
        <span className="slot-box">
          [SLOT: {slotName}]
          <span>Provide image URL</span>
        </span>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        onError={() => setOk(false)}
      />
    </>
  );
}
