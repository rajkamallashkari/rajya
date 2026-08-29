import { MOBILE_MAX_PX } from "@/shared/lib/navigation/constants";

export function isMobileViewport(): boolean {
  return (
    window.innerWidth < MOBILE_MAX_PX ||
    window.matchMedia(`(max-width: ${MOBILE_MAX_PX - 1}px)`).matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function subscribeViewport(onStoreChange: () => void): () => void {
  const maxWidth = window.matchMedia(`(max-width: ${MOBILE_MAX_PX - 1}px)`);
  const coarse = window.matchMedia("(pointer: coarse)");
  maxWidth.addEventListener("change", onStoreChange);
  coarse.addEventListener("change", onStoreChange);
  window.addEventListener("resize", onStoreChange);
  return () => {
    maxWidth.removeEventListener("change", onStoreChange);
    coarse.removeEventListener("change", onStoreChange);
    window.removeEventListener("resize", onStoreChange);
  };
}
