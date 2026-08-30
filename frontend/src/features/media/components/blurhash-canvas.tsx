import { useEffect, useRef } from "react";
import { paintBlurhash } from "@/features/media/model/progressive";
import { BLURHASH_PIXELS } from "@/features/media/model/constants";

export function BlurhashCanvas({ hash }: { hash: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (canvas) {
      paintBlurhash(canvas, hash);
    }
  }, [hash]);
  return (
    <canvas
      aria-hidden
      className="absolute inset-0 h-full w-full"
      data-blurhash=""
      height={BLURHASH_PIXELS}
      ref={ref}
      width={BLURHASH_PIXELS}
    />
  );
}
