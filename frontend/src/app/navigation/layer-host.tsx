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
} from "@/shared/lib/navigation/column-layout";
import {
  DESKTOP_CHAT_COLUMNS,
  LAYER_MIN_WIDTH_PX,
  LAYER_OVERLAY_WIDTH_PX,
} from "@/shared/lib/navigation/constants";
import {
  partitionLayers,
  useLayerStore,
  type LayerEntry,
} from "@/shared/lib/navigation/layer-store";
import { Button } from "@/shared/ui/button";

export function LayerHost({
  base,
  empty,
  renderLayer,
}: {
  base: ReactNode;
  empty?: ReactNode;
  renderLayer: (layer: LayerEntry) => ReactNode;
}): ReactNode {
  const layers = useLayerStore((state) => state.layers);
  const mobile = useMobileViewport();
  const depth = layers.length;
  const { conversation, details } = partitionLayers(layers);
  const overlayOpen = details.length > 0;
  const hostRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
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
          hostWidth,
          listWidth: current.list,
        });
        if (next.list === current.list) {
          return current;
        }
        return next;
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(host);
    return () => observer.disconnect();
  }, [mobile]);

  const listStyle = mobile
    ? undefined
    : { flex: `0 0 ${String(columns.list)}px`, minWidth: LAYER_MIN_WIDTH_PX };

  return (
    <div
      className={cn(
        "layer-host min-h-0 flex-1",
        mobile ? "layer-host-mobile" : "layer-host-desktop",
      )}
      data-desktop-columns={mobile ? undefined : DESKTOP_CHAT_COLUMNS}
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
              overlay={false}
              top={index === depth - 1}
            >
              {renderLayer(layer)}
            </LayerPanel>
          ))
        : null}
      {mobile ? null : (
        <>
          <PanelResizeHandle
            measure={() => ({
              hostWidth: hostRef.current?.getBoundingClientRect().width || window.innerWidth,
              originWidth: baseRef.current?.getBoundingClientRect().width || columns.list,
            })}
            onWidth={(list) => setColumns({ list })}
          />
          <div
            className="layer-chat-column"
            data-layer-column="chat"
            style={{ minWidth: LAYER_MIN_WIDTH_PX }}
          >
            {conversation ? (
              <LayerPanel
                index={0}
                layer={conversation}
                mobile={false}
                overlay={false}
                top={!overlayOpen}
              >
                {renderLayer(conversation)}
              </LayerPanel>
            ) : (
              empty
            )}
            {overlayOpen ? (
              <div
                className="layer-overlay-stack"
                data-column-width={String(LAYER_OVERLAY_WIDTH_PX)}
                data-layer-column="overlay"
              >
                {details.map((layer, index) => (
                  <LayerPanel
                    key={layer.id}
                    index={index + 1}
                    layer={layer}
                    mobile={false}
                    overlay
                    top={index === details.length - 1}
                  >
                    {renderLayer(layer)}
                  </LayerPanel>
                ))}
              </div>
            ) : null}
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
  overlay,
  top,
}: {
  children: ReactNode;
  index: number;
  layer: LayerEntry;
  mobile: boolean;
  overlay: boolean;
  top: boolean;
}): ReactNode {
  const popLayer = useLayerStore((state) => state.popLayer);
  const frameRef = useRef<HTMLElement>(null);
  useLayer(layer.id, mobile || layer.kind !== "conversation", () => popLayer());
  const swipe = useEdgeSwipe(mobile && top, () => window.history.back());
  const buried = mobile ? !top : overlay && !top;
  usePreserveLayerScroll(frameRef, !buried);

  return (
    <section
      aria-label={layer.title}
      className={cn(
        "layer-frame",
        mobile && "layer-frame-mobile",
        overlay && "layer-frame-overlay",
      )}
      data-layer={layer.kind}
      data-layer-id={layer.id}
      data-layer-index={index}
      data-layer-top={top ? "true" : "false"}
      ref={frameRef}
      style={mobile || overlay ? undefined : { minWidth: LAYER_MIN_WIDTH_PX }}
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
  measure,
  onWidth,
}: {
  measure: () => {
    hostWidth: number;
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
        hostWidth: drag.current.hostWidth,
        originWidth: drag.current.originWidth,
        startX: drag.current.originX,
      });
      setDelta(next);
      onWidth(next);
    },
    [onWidth],
  );

  return (
    <Button
      aria-label={t("layers.resize")}
      className="layer-resize"
      data-resize-delta={delta}
      data-resize-edge="list"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      type="button"
      variant="ghost"
    />
  );
}
