import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { GroupedVirtuoso, type VirtuosoHandle } from "react-virtuoso";
import { JumpToLatestPill } from "@/features/conversations/components/jump-to-latest-pill";
import {
  THREAD_AT_BOTTOM_THRESHOLD_PX,
  THREAD_OVERSCAN_PX,
  THREAD_VIEWPORT_BOTTOM_PX,
  THREAD_VIEWPORT_TOP_PX,
} from "@/features/conversations/model/constants";
import { formatThreadDate } from "@/features/conversations/model/dates";
import {
  buildThreadWindow,
  nextPendingCount,
  restoreAnchorIndex,
  shouldShowJumpPill,
  type ThreadRun,
} from "@/features/conversations/model/thread-window";
import type { Message } from "@/features/conversations/api/http";
import { DateDivider } from "@/features/messages";

export function VirtualizedThread({
  conversationId,
  focusMessageId,
  footer,
  header,
  hasMoreOlder,
  loadingOlder,
  locale,
  messages,
  onLoadOlder,
  renderRun,
  scrollerRef,
}: {
  conversationId: string;
  focusMessageId?: string;
  footer?: ReactNode;
  header?: ReactNode;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  locale: string;
  messages: Message[];
  onLoadOlder: () => void;
  renderRun: (run: ThreadRun) => ReactNode;
  scrollerRef: Ref<HTMLElement | null>;
}) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const { groups, groupCounts, runs } = useMemo(() => buildThreadWindow(messages), [messages]);
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const runsRef = useRef(runs);
  runsRef.current = runs;
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const maxPositionRef = useRef(0);
  const visibleStartRef = useRef(0);
  const loadAnchorRef = useRef<number | null>(null);
  const prevRunCountRef = useRef(0);
  const Header = useCallback(() => <>{header}</>, [header]);
  const Footer = useCallback(() => <>{footer}</>, [footer]);

  useEffect(() => {
    atBottomRef.current = true;
    setAtBottom(true);
    setPendingCount(0);
    maxPositionRef.current = 0;
    prevRunCountRef.current = 0;
    loadAnchorRef.current = null;
  }, [conversationId]);

  useEffect(() => {
    const max = messages.reduce((current, message) => Math.max(current, message.position), 0);
    setPendingCount((current) =>
      nextPendingCount(atBottomRef.current, maxPositionRef.current, messages, current),
    );
    maxPositionRef.current = max;
  }, [messages]);

  useLayoutEffect(() => {
    if (runs.length === 0) {
      prevRunCountRef.current = 0;
      return;
    }
    const previous = prevRunCountRef.current;
    prevRunCountRef.current = runs.length;
    if (previous === 0) {
      if (focusMessageId) {
        const index = runs.findIndex((run) => run.messages.some((row) => String(row.id) === focusMessageId));
        if (index >= 0) {
          virtuosoRef.current?.scrollToIndex({ align: "center", behavior: "auto", index });
          return;
        }
      }
      virtuosoRef.current?.scrollToIndex({ align: "end", behavior: "auto", index: runs.length - 1 });
      return;
    }
    if (runs.length > previous && loadAnchorRef.current !== null) {
      const target = restoreAnchorIndex(loadAnchorRef.current, runs.length - previous);
      virtuosoRef.current?.scrollToIndex({ align: "start", behavior: "auto", index: target });
      loadAnchorRef.current = null;
    }
  }, [focusMessageId, runs]);

  const assignScroller = useCallback(
    (node: HTMLElement | Window | null) => {
      const element = node instanceof HTMLElement ? node : null;
      if (element) {
        element.setAttribute("data-layer-scroll", conversationId);
      }
      if (typeof scrollerRef === "function") {
        scrollerRef(element);
        return;
      }
      if (scrollerRef) {
        scrollerRef.current = element;
      }
    },
    [conversationId, scrollerRef],
  );

  if (runs.length === 0) {
    return (
      <div
        className="relative min-h-0 flex-1 overflow-y-auto px-[var(--space-list-x)] py-[var(--space-list-y)]"
        data-layer-scroll={conversationId}
        ref={assignScroller}
      >
        {header}
        {footer}
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <GroupedVirtuoso
        atBottomStateChange={(value) => {
          atBottomRef.current = value;
          setAtBottom(value);
          if (value) {
            setPendingCount(0);
          }
        }}
        atBottomThreshold={THREAD_AT_BOTTOM_THRESHOLD_PX}
        components={{ Footer, Header }}
        followOutput={(isAtBottom) => (isAtBottom ? "auto" : false)}
        groupContent={(groupIndex) => {
          const group = groupsRef.current[groupIndex]!;
          return (
            <div className="flex h-[var(--space-10)] items-center justify-center">
              <DateDivider label={formatThreadDate(group.iso, locale)} />
            </div>
          );
        }}
        groupCounts={groupCounts}
        increaseViewportBy={{ bottom: THREAD_VIEWPORT_BOTTOM_PX, top: THREAD_VIEWPORT_TOP_PX }}
        itemContent={(index) => {
          const run = runsRef.current[index]!;
          return renderRun(run);
        }}
        overscan={THREAD_OVERSCAN_PX}
        rangeChanged={(range) => {
          visibleStartRef.current = range.startIndex;
        }}
        ref={virtuosoRef}
        scrollerRef={assignScroller}
        startReached={() => {
          if (!hasMoreOlder || loadingOlder) {
            return;
          }
          if (!atBottomRef.current) {
            loadAnchorRef.current = visibleStartRef.current;
          }
          onLoadOlder();
        }}
        style={{ height: "100%" }}
      />
      {shouldShowJumpPill(atBottom, pendingCount) ? (
        <JumpToLatestPill
          count={pendingCount}
          onJump={() => {
            atBottomRef.current = true;
            setAtBottom(true);
            setPendingCount(0);
            virtuosoRef.current?.scrollToIndex({
              align: "end",
              behavior: "smooth",
              index: "LAST",
            });
          }}
        />
      ) : null}
    </div>
  );
}
