import {
  type ReactNode,
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useEdgeSwipe } from "@/shared/hooks/use-edge-swipe";
import { useLayer } from "@/shared/hooks/use-layer";
import { useMobileViewport } from "@/shared/hooks/use-mobile-viewport";
import { usePreserveLayerScroll } from "@/shared/hooks/use-preserve-layer-scroll";
import { cn } from "@/shared/lib/cn";
import { LAYER_MIN_WIDTH_PX } from "@/shared/lib/navigation/constants";
import { Button } from "@/shared/ui/button";
import { useLayerStore, type LayerEntry } from "@/shared/lib/navigation/layer-store";

export function LayerHost({
  base,
  renderLayer,
}: {
  base: ReactNode;
  renderLayer: (layer: LayerEntry) => ReactNode;
}): ReactNode {
  const layers = useLayerStore((state) => state.layers);
  const mobile = useMobileViewport();
  const depth = layers.length;
  const baseRef = useRef<HTMLDivElement>(null);
  usePreserveLayerScroll(baseRef, !(mobile && depth > 0));

  return (
    <div
      className={cn(
        "layer-host min-h-0 flex-1",
        mobile ? "layer-host-mobile" : "layer-host-desktop",
      )}
      data-layer-host=""
      data-presentation={mobile ? "mobile" : "desktop"}
      data-stack-depth={depth}
    >
      <div
        className="layer-base"
        data-layer="base"
        ref={baseRef}
        {...(mobile && depth > 0 ? { inert: true, "aria-hidden": true } : {})}
      >
        {base}
      </div>
      {layers.map((layer, index) => (
        <LayerPanel
          key={layer.id}
          index={index}
          layer={layer}
          mobile={mobile}
          top={index === depth - 1}
        >
          {renderLayer(layer)}
        </LayerPanel>
      ))}
    </div>
  );
}

function LayerPanel({
  children,
  index,
  layer,
  mobile,
  top,
}: {
  children: ReactNode;
  index: number;
  layer: LayerEntry;
  mobile: boolean;
  top: boolean;
}): ReactNode {
  const popLayer = useLayerStore((state) => state.popLayer);
  const frameRef = useRef<HTMLElement>(null);
  useLayer(layer.id, true, () => popLayer());
  const swipe = useEdgeSwipe(mobile && top, () => window.history.back());
  const buried = mobile && !top;
  usePreserveLayerScroll(frameRef, !buried);

  return (
    <>
      {mobile ? null : <PanelResizeHandle />}
      <section
        aria-label={layer.title}
        className={cn("layer-frame", mobile && "layer-frame-mobile")}
        data-layer={layer.kind}
        data-layer-id={layer.id}
        data-layer-index={index}
        data-layer-top={top ? "true" : "false"}
        ref={frameRef}
        onPointerCancel={swipe.onPointerCancel}
        onPointerDown={swipe.onPointerDown}
        onPointerMove={swipe.onPointerMove}
        onPointerUp={swipe.onPointerUp}
        {...(buried ? { inert: true, "aria-hidden": true } : {})}
      >
        {children}
      </section>
    </>
  );
}

function PanelResizeHandle(): ReactNode {
  const { t } = useTranslation();
  const [delta, setDelta] = useState(0);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.originX = String(event.clientX);
    const panel = event.currentTarget.nextElementSibling;
    const measured = panel instanceof HTMLElement ? panel.getBoundingClientRect().width : 0;
    event.currentTarget.dataset.originWidth = String(
      measured > 0 ? measured : LAYER_MIN_WIDTH_PX,
    );
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    const startX = Number(event.currentTarget.dataset.originX ?? event.clientX);
    const originWidth = Number(event.currentTarget.dataset.originWidth ?? LAYER_MIN_WIDTH_PX);
    const next = Math.max(LAYER_MIN_WIDTH_PX, originWidth + (startX - event.clientX));
    setDelta(next);
    const panel = event.currentTarget.nextElementSibling;
    if (panel instanceof HTMLElement) {
      panel.style.flex = `0 0 ${String(next)}px`;
    }
  }, []);

  return (
    <Button
      aria-label={t("layers.resize")}
      className="layer-resize"
      data-resize-delta={delta}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      type="button"
      variant="ghost"
    />
  );
}
