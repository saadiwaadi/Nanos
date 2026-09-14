"use client";

import { useState } from "react";

/**
 * Renders an image, or a labeled placeholder box when the URL is empty or
 * fails to load — so missing photography is always visibly named
 * ([IMG-06 · PRODUCT-IMAGE] etc.) and can be filled in later in one place.
 * `slotNum` is the stable registry number (lib/imageSlots.ts) shown in the
 * fallback and as a small badge on the loaded image, so the same image is
 * identifiable everywhere it appears.
 */
export function ImgOrSlot({
  src,
  alt,
  slotName,
  slotNum,
  className,
  slotClassName = "thumb-slot",
  showBadge = false,
}: {
  src: string;
  alt: string;
  slotName: string;
  slotNum?: string;
  className?: string;
  slotClassName?: string;
  /** Show the number badge even when the image loads (dev reference). */
  showBadge?: boolean;
}) {
  const [ok, setOk] = useState(src.length > 0);

  if (!ok) {
    return (
      <div className={slotClassName}>
        <span className="slot-box">
          {slotNum && <b className="slot-num">{slotNum}</b>}[SLOT: {slotName}]
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
      {showBadge && slotNum && (
        <span className="img-slot-badge">{slotNum}</span>
      )}
    </>
  );
}
