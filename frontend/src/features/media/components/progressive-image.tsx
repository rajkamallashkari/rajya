import { useState } from "react";
import { BlurhashCanvas } from "@/features/media/components/blurhash-canvas";
import { aspectStyle } from "@/features/media/model/constants";
import { progressiveStage } from "@/features/media/model/progressive";
import { cn } from "@/shared/lib/cn";

export function ProgressiveImage({
  alt,
  blurhash,
  className,
  fullSrc,
  height,
  onClick,
  thumbSrc,
  width,
}: {
  alt: string;
  blurhash?: string | null;
  className?: string;
  fullSrc?: string | null;
  height?: number | null;
  onClick?: () => void;
  thumbSrc?: string | null;
  width?: number | null;
}) {
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [fullLoaded, setFullLoaded] = useState(false);
  const stage = progressiveStage(thumbLoaded, fullLoaded);
  const box = aspectStyle(width, height);

  return (
    <div
      className={cn("relative overflow-hidden bg-[var(--surface-input)]", className)}
      data-progressive-stage={stage}
      style={box}
    >
      {stage !== "full" && blurhash ? <BlurhashCanvas hash={blurhash} /> : null}
      {thumbSrc ? (
        <img
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            thumbLoaded && stage !== "full" ? "opacity-100" : "opacity-0",
          )}
          decoding="async"
          onLoad={() => setThumbLoaded(true)}
          src={thumbSrc}
        />
      ) : null}
      {fullSrc ? (
        <img
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            fullLoaded ? "opacity-100" : "opacity-0",
          )}
          decoding="async"
          onClick={onClick}
          onLoad={() => setFullLoaded(true)}
          src={fullSrc}
        />
      ) : null}
    </div>
  );
}
