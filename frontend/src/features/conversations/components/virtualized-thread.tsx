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

function runIndexForFocus(runs: ThreadRun[], focusMessageId?: string): number {
  if (!focusMessageId) {
    return -1;
  }
  return runs.findIndex((run) => run.messages.some((row) => String(row.id) === focusMessageId));
}

function scrollerIsAtBottom(node: HTMLElement | null): boolean {
  if (!node) {
    return true;
  }
  const overflow = node.scrollHeight - node.clientHeight;
  if (overflow <= THREAD_AT_BOTTOM_THRESHOLD_PX) {
    return false;
  }
  return overflow - node.scrollTop <= THREAD_AT_BOTTOM_THRESHOLD_PX;
}

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
  restoreEpoch = 0,
  restoreScrollTop = null,
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
  restoreEpoch?: number;
  restoreScrollTop?: number | null;
  scrollerRef: Ref<HTMLElement | null>;
}) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollerNodeRef = useRef<HTMLElement | null>(null);
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
  const lastFocusRef = useRef<string | undefined>(undefined);
  const lastAppliedEpochRef = useRef(0);
  const suppressFollowRef = useRef(false);
  const pinnedScrollTopRef = useRef<number | null>(null);
  const intentionalScrollRef = useRef(false);
  const restoringPinRef = useRef(false);
  const detachScrollerScrollRef = useRef<(() => void) | null>(null);
  const initialConversationRef = useRef(conversationId);
  const initialTopMostRef = useRef<{ align: "center" | "end"; index: number } | null>(null);
  const Header = useCallback(() => <>{header}</>, [header]);
  const Footer = useCallback(() => <>{footer}</>, [footer]);

  if (initialConversationRef.current !== conversationId) {
    initialConversationRef.current = conversationId;
    initialTopMostRef.current = null;
  }
  if (runs.length > 0 && initialTopMostRef.current == null) {
    const focusIndex = runIndexForFocus(runs, focusMessageId);
    initialTopMostRef.current =
      focusIndex >= 0
        ? { align: "center", index: focusIndex }
        : { align: "end", index: runs.length - 1 };
  }

  const applyPinnedScroll = (top: number): void => {
    virtuosoRef.current?.scrollTo({ top });
    if (scrollerNodeRef.current) {
      scrollerNodeRef.current.scrollTop = top;
    }
  };

  const beginIntentionalScroll = (): void => {
    intentionalScrollRef.current = true;
    pinnedScrollTopRef.current = null;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        intentionalScrollRef.current = false;
      });
    });
  };

  const onScrollerScroll = (): void => {
    const node = scrollerNodeRef.current;
    if (!node || restoringPinRef.current) {
      return;
    }
    const atBottom = scrollerIsAtBottom(node);
    if (intentionalScrollRef.current) {
      atBottomRef.current = atBottom;
      pinnedScrollTopRef.current = atBottom ? null : node.scrollTop;
      return;
    }
    if (pinnedScrollTopRef.current != null && atBottom) {
      restoringPinRef.current = true;
      applyPinnedScroll(pinnedScrollTopRef.current);
      atBottomRef.current = false;
      setAtBottom(false);
      requestAnimationFrame(() => {
        restoringPinRef.current = false;
      });
      return;
    }
    if (atBottom) {
      pinnedScrollTopRef.current = null;
      if (!atBottomRef.current) {
        atBottomRef.current = true;
        setAtBottom(true);
      }
      return;
    }
    pinnedScrollTopRef.current = node.scrollTop;
    if (atBottomRef.current) {
      atBottomRef.current = false;
      setAtBottom(false);
    }
  };

  const onScrollerScrollRef = useRef(onScrollerScroll);
  onScrollerScrollRef.current = onScrollerScroll;

  useEffect(() => {
    atBottomRef.current = true;
    setAtBottom(true);
    setPendingCount(0);
    maxPositionRef.current = 0;
    prevRunCountRef.current = 0;
    loadAnchorRef.current = null;
    lastFocusRef.current = undefined;
    lastAppliedEpochRef.current = 0;
    suppressFollowRef.current = false;
    pinnedScrollTopRef.current = null;
    intentionalScrollRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    const max = messages.reduce((current, message) => Math.max(current, message.position), 0);
    setPendingCount((current) =>
      nextPendingCount(atBottomRef.current, maxPositionRef.current, messages, current),
    );
    maxPositionRef.current = max;
  }, [messages]);

  useLayoutEffect(() => {
    const applyRestore = (top: number): void => {
      const pin = (): void => {
        applyPinnedScroll(top);
      };
      suppressFollowRef.current = true;
      intentionalScrollRef.current = true;
      pinnedScrollTopRef.current = top;
      atBottomRef.current = false;
      setAtBottom(false);
      pin();
      requestAnimationFrame(() => {
        if (pinnedScrollTopRef.current !== top) {
          return;
        }
        pin();
        requestAnimationFrame(() => {
          if (pinnedScrollTopRef.current !== top) {
            return;
          }
          pin();
          intentionalScrollRef.current = false;
          suppressFollowRef.current = false;
        });
      });
    };

    if (restoreEpoch > 0 && restoreScrollTop != null && lastAppliedEpochRef.current !== restoreEpoch) {
      lastAppliedEpochRef.current = restoreEpoch;
      lastFocusRef.current = focusMessageId;
      applyRestore(restoreScrollTop);
      if (runs.length === 0) {
        prevRunCountRef.current = 0;
      } else {
        prevRunCountRef.current = runs.length;
      }
      return;
    }

    if (runs.length === 0) {
      prevRunCountRef.current = 0;
      return;
    }
    const previous = prevRunCountRef.current;
    prevRunCountRef.current = runs.length;
    if (previous === 0) {
      lastFocusRef.current = focusMessageId;
      return;
    }
    if (focusMessageId && focusMessageId !== lastFocusRef.current) {
      const index = runIndexForFocus(runs, focusMessageId);
      if (index >= 0) {
        beginIntentionalScroll();
        virtuosoRef.current?.scrollToIndex({ align: "center", behavior: "auto", index });
      }
      lastFocusRef.current = focusMessageId;
      return;
    }
    lastFocusRef.current = focusMessageId;
    if (runs.length > previous && loadAnchorRef.current !== null) {
      const target = restoreAnchorIndex(loadAnchorRef.current, runs.length - previous);
      beginIntentionalScroll();
      virtuosoRef.current?.scrollToIndex({ align: "start", behavior: "auto", index: target });
      loadAnchorRef.current = null;
    }
  }, [focusMessageId, restoreEpoch, restoreScrollTop, runs]);

  const assignScroller = useCallback((node: HTMLElement | Window | null) => {
    detachScrollerScrollRef.current?.();
    detachScrollerScrollRef.current = null;
    const element = node instanceof HTMLElement ? node : null;
    scrollerNodeRef.current = element;
    if (element) {
      element.setAttribute("data-layer-scroll", conversationId);
      const onScroll = (): void => {
        onScrollerScrollRef.current();
      };
      element.addEventListener("scroll", onScroll);
      detachScrollerScrollRef.current = () => {
        element.removeEventListener("scroll", onScroll);
      };
    }
    if (typeof scrollerRef === "function") {
      scrollerRef(element);
      return;
    }
    if (scrollerRef) {
      scrollerRef.current = element;
    }
  }, [conversationId, scrollerRef]);

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
        key={conversationId}
        atBottomStateChange={(value) => {
          if (
            value &&
            (pinnedScrollTopRef.current != null ||
              suppressFollowRef.current ||
              !scrollerIsAtBottom(scrollerNodeRef.current))
          ) {
            return;
          }
          atBottomRef.current = value;
          setAtBottom(value);
          if (value) {
            setPendingCount(0);
          }
        }}
        atBottomThreshold={THREAD_AT_BOTTOM_THRESHOLD_PX}
        components={{ Footer, Header }}
        followOutput={(isAtBottom) => {
          if (
            pinnedScrollTopRef.current != null ||
            suppressFollowRef.current ||
            !scrollerIsAtBottom(scrollerNodeRef.current)
          ) {
            return false;
          }
          return isAtBottom ? "auto" : false;
        }}
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
        initialTopMostItemIndex={initialTopMostRef.current!}
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
            beginIntentionalScroll();
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
