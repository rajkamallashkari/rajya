import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";

export const GroupedVirtuoso = forwardRef(function GroupedVirtuoso(
  {
    atBottomStateChange,
    components,
    followOutput,
    groupContent,
    groupCounts = [],
    itemContent,
    scrollerRef,
    startReached,
    rangeChanged,
    style,
  }: {
    atBottomStateChange?: (atBottom: boolean) => void;
    components?: { Footer?: () => ReactNode; Header?: () => ReactNode };
    followOutput?: (isAtBottom: boolean) => unknown;
    groupContent?: (index: number) => ReactNode;
    groupCounts?: number[];
    itemContent?: (index: number) => ReactNode;
    scrollerRef?: (node: HTMLElement | Window | null) => void;
    startReached?: () => void;
    style?: CSSProperties;
    rangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
  },
  ref,
) {
  const atBottom = useRef(atBottomStateChange);
  atBottom.current = atBottomStateChange;
  const onRange = useRef(rangeChanged);
  onRange.current = rangeChanged;
  const onFollow = useRef(followOutput);
  onFollow.current = followOutput;
  followOutput?.(true);
  followOutput?.(false);
  const scrollerNode = useRef<HTMLDivElement | null>(null);
  useImperativeHandle(ref, () => ({
    scrollTo: (location: ScrollToOptions) => {
      if (scrollerNode.current != null && location.top != null) {
        scrollerNode.current.scrollTop = location.top;
      }
    },
    scrollToIndex: () => undefined,
  }));
  useEffect(() => {
    atBottom.current?.(true);
    onRange.current?.({ endIndex: 0, startIndex: 0 });
    onFollow.current?.(true);
    onFollow.current?.(false);
  }, []);
  const Header = components?.Header;
  const Footer = components?.Footer;
  let index = 0;
  return (
    <div
      data-virtuoso=""
      onScroll={(event: UIEvent<HTMLDivElement>) => {
        const node = event.currentTarget;
        if (node.scrollTop <= 0) {
          startReached?.();
          atBottomStateChange?.(false);
          return;
        }
        atBottomStateChange?.(true);
      }}
      ref={(node) => {
        scrollerNode.current = node;
        scrollerRef?.(node);
      }}
      style={style}
    >
      {Header ? <Header /> : null}
      {groupCounts.map((count, groupIndex) => (
        <div data-virtuoso-group={String(groupIndex)} key={groupIndex}>
          {groupContent?.(groupIndex)}
          {Array.from({ length: count }, () => {
            const current = index;
            index += 1;
            return <div key={current}>{itemContent?.(current)}</div>;
          })}
        </div>
      ))}
      {Footer ? <Footer /> : null}
    </div>
  );
});
