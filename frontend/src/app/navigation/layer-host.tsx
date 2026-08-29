import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
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
import {
  defaultDesktopColumns,
  fitDesktopColumns,
  widthAfterResize,
  type DesktopResizeEdge,
} from "@/shared/lib/navigation/column-layout";
import { LAYER_MIN_WIDTH_PX } from "@/shared/lib/navigation/constants";
import {
  partitionLayers,
  useLayerStore,
  type LayerEntry,
} from "@/shared/lib/navigation/layer-store";
import { Button } from "@/shared/ui/button";

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
  const { conversation, details } = partitionLayers(layers);
  const desktopColumns = 1 + (conversation ? 1 : 0) + (details.length > 0 ? 1 : 0);
  const detailOpen = details.length > 0;
  const hostRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(defaultDesktopColumns);
  usePreserveLayerScroll(baseRef, !(mobile && depth > 0));

  useLayoutEffect(() => {
    if (mobile) {
      return;
    }
    const host = hostRef.current as HTMLDivElement;
    const apply = (): void => {
      const hostWidth = host.getBoundingClientRect().width || window.innerWidth;
      setColumns((current) => {
        const next = fitDesktopColumns({
          detailOpen,
          detailWidth: current.detail,
          hostWidth,
          listWidth: current.list,
        });
        if (next.list === current.list && next.detail === current.detail) {
          return current;
        }
        return next;
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(host);
    return () => observer.disconnect();
  }, [detailOpen, mobile]);

  const listStyle = mobile
    ? undefined
    : { flex: `0 0 ${String(columns.list)}px`, minWidth: LAYER_MIN_WIDTH_PX };
  const detailStyle = {
    flex: `0 0 ${String(columns.detail)}px`,
    minWidth: LAYER_MIN_WIDTH_PX,
  };

  return (
    <div
      className={cn(
        "layer-host min-h-0 flex-1",
        mobile ? "layer-host-mobile" : "layer-host-desktop",
      )}
      data-desktop-columns={mobile ? undefined : desktopColumns}
      data-layer-host=""
      data-presentation={mobile ? "mobile" : "desktop"}
      data-stack-depth={depth}
      ref={hostRef}
    >
      <div
        className="layer-base"
        data-column-width={mobile ? undefined : String(columns.list)}
        data-layer="base"
        ref={baseRef}
        style={listStyle}
        {...(mobile && depth > 0 ? { inert: true, "aria-hidden": true } : {})}
      >
        {base}
      </div>
      {mobile
        ? layers.map((layer, index) => (
            <LayerPanel
              key={layer.id}
              index={index}
              layer={layer}
              mobile
              stacked={false}
              top={index === depth - 1}
            >
              {renderLayer(layer)}
            </LayerPanel>
          ))
        : null}
      {mobile || !conversation ? null : (
        <>
          <PanelResizeHandle
            edge="list"
            measure={() => ({
              detailOpen,
              detailWidth: columns.detail,
              hostWidth: hostRef.current?.getBoundingClientRect().width || window.innerWidth,
              listWidth: columns.list,
              originWidth: baseRef.current?.getBoundingClientRect().width || columns.list,
            })}
            onWidth={(list) => setColumns((current) => ({ ...current, list }))}
          />
          <LayerPanel
            index={0}
            layer={conversation}
            mobile={false}
            stacked={false}
            top={!detailOpen}
          >
            {renderLayer(conversation)}
          </LayerPanel>
        </>
      )}
      {mobile || !detailOpen ? null : (
        <>
          <PanelResizeHandle
            edge="detail"
            measure={() => ({
              detailOpen: true,
              detailWidth: columns.detail,
              hostWidth: hostRef.current?.getBoundingClientRect().width || window.innerWidth,
              listWidth: columns.list,
              originWidth: detailRef.current?.getBoundingClientRect().width || columns.detail,
            })}
            onWidth={(detail) => setColumns((current) => ({ ...current, detail }))}
          />
          <div
            className="layer-detail-column"
            data-column-width={String(columns.detail)}
            data-layer-column="detail"
            ref={detailRef}
            style={detailStyle}
          >
            {details.map((layer, index) => (
              <LayerPanel
                key={layer.id}
                index={index + 1}
                layer={layer}
                mobile={false}
                stacked
                top={index === details.length - 1}
              >
                {renderLayer(layer)}
              </LayerPanel>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LayerPanel({
  children,
  index,
  layer,
  mobile,
  stacked,
  top,
}: {
  children: ReactNode;
  index: number;
  layer: LayerEntry;
  mobile: boolean;
  stacked: boolean;
  top: boolean;
}): ReactNode {
  const popLayer = useLayerStore((state) => state.popLayer);
  const frameRef = useRef<HTMLElement>(null);
  useLayer(layer.id, mobile || layer.kind !== "conversation", () => popLayer());
  const swipe = useEdgeSwipe(mobile && top, () => window.history.back());
  const buried = mobile ? !top : stacked && !top;
  usePreserveLayerScroll(frameRef, !buried);

  return (
    <section
      aria-label={layer.title}
      className={cn(
        "layer-frame",
        mobile && "layer-frame-mobile",
        stacked && "layer-frame-stacked",
      )}
      data-layer={layer.kind}
      data-layer-id={layer.id}
      data-layer-index={index}
      data-layer-top={top ? "true" : "false"}
      ref={frameRef}
      style={mobile || stacked ? undefined : { minWidth: LAYER_MIN_WIDTH_PX }}
      onPointerCancel={swipe.onPointerCancel}
      onPointerDown={swipe.onPointerDown}
      onPointerMove={swipe.onPointerMove}
      onPointerUp={swipe.onPointerUp}
      {...(buried ? { inert: true, "aria-hidden": true } : {})}
    >
      {children}
    </section>
  );
}

function PanelResizeHandle({
  edge,
  measure,
  onWidth,
}: {
  edge: DesktopResizeEdge;
  measure: () => {
    detailOpen: boolean;
    detailWidth: number;
    hostWidth: number;
    listWidth: number;
    originWidth: number;
  };
  onWidth: (width: number) => void;
}): ReactNode {
  const { t } = useTranslation();
  const [delta, setDelta] = useState(0);
  const drag = useRef({ originX: 0, ...measure() });

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { originX: event.clientX, ...measure() };
    },
    [measure],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        return;
      }
      const next = widthAfterResize({
        clientX: event.clientX,
        detailOpen: drag.current.detailOpen,
        detailWidth: drag.current.detailWidth,
        edge,
        hostWidth: drag.current.hostWidth,
        listWidth: drag.current.listWidth,
        originWidth: drag.current.originWidth,
        startX: drag.current.originX,
      });
      setDelta(next);
      onWidth(next);
    },
    [edge, onWidth],
  );

  return (
    <Button
      aria-label={t("layers.resize")}
      className="layer-resize"
      data-resize-delta={delta}
      data-resize-edge={edge}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      type="button"
      variant="ghost"
    />
  );
}
