import { useCallback, useEffect, useRef } from "react";
import { addLayer, removeLayer } from "@/shared/lib/navigation/layer-stack";

export function useLayer(
  id: string,
  isOpen: boolean,
  setOpen: (open: boolean) => void,
): { close: () => void } {
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    addLayer(id, () => setOpenRef.current(false));
    return () => removeLayer(id);
  }, [id, isOpen]);

  const close = useCallback((): void => {
    setOpenRef.current(false);
  }, []);

  return { close };
}
