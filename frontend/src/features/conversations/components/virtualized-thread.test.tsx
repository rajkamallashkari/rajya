import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VirtualizedThread } from "./virtualized-thread";
import type { Message } from "@/features/conversations/api/http";
import { en } from "@/shared/lib/i18n/catalog";

function message(id: number, extras: Partial<Message> = {}): Message {
  return {
    attachments: [],
    body: `m${String(id)}`,
    created_at: "2026-01-01T12:00:00.000Z",
    deleted: false,
    id,
    kind: "text",
    position: id,
    revision: 1,
    sender: { display_name: "Ada", id: 1, username: "ada" },
    silent: false,
    ...extras,
  } as Message;
}

async function flush(): Promise<void> {
  await Promise.resolve();
}

async function nextFrame(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}

function overflowAt(node: HTMLElement, top: number): void {
  Object.defineProperty(node, "clientHeight", { configurable: true, get: () => 715 });
  Object.defineProperty(node, "scrollHeight", { configurable: true, get: () => 4106 });
  Object.defineProperty(node, "scrollTop", { configurable: true, writable: true, value: top });
}

describe("VirtualizedThread", () => {
  it("renders an empty scroller and loads older messages on scroll", async () => {
    const onLoadOlder = vi.fn();
    const { rerender } = render(
      <VirtualizedThread
        conversationId="1"
        hasMoreOlder
        loadingOlder={false}
        locale="en"
        messages={[]}
        onLoadOlder={onLoadOlder}
        renderRun={() => null}
        scrollerRef={{ current: null }}
      />,
    );
    expect(document.querySelector("[data-layer-scroll='1']")).not.toBeNull();

    rerender(
      <VirtualizedThread
        conversationId="1"
        footer={<p>footer</p>}
        header={<p>header</p>}
        hasMoreOlder
        loadingOlder={false}
        locale="en"
        messages={[message(1), message(2, { created_at: "2026-01-02T12:00:00.000Z" })]}
        onLoadOlder={onLoadOlder}
        renderRun={(run) => <p>{run.messages[0]?.body}</p>}
        scrollerRef={(node) => {
          if (node) {
            node.setAttribute("data-assigned", "1");
          }
        }}
      />,
    );
    expect(screen.getByText("m1")).toBeInTheDocument();
    expect(screen.getByText("header")).toBeInTheDocument();
    await flush();
    const scroller = document.querySelector("[data-virtuoso]") as HTMLDivElement;
    Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 0 });
    fireEvent.scroll(scroller);
    expect(onLoadOlder).toHaveBeenCalled();

    rerender(
      <VirtualizedThread
        conversationId="1"
        focusMessageId="1"
        hasMoreOlder={false}
        loadingOlder
        locale="en"
        messages={[message(1), message(2), message(3)]}
        onLoadOlder={onLoadOlder}
        renderRun={(run) => <p>{run.messages[0]?.body}</p>}
        scrollerRef={{ current: null }}
      />,
    );
    expect(await screen.findByRole("button", { name: en.conversations.jump_to_latest })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: en.conversations.jump_to_latest }));
    const live = document.querySelector("[data-virtuoso]") as HTMLDivElement;
    overflowAt(live, 3391);
    fireEvent.scroll(live);
    overflowAt(live, 40);
    fireEvent.scroll(live);

    onLoadOlder.mockClear();
    rerender(
      <VirtualizedThread
        conversationId="1"
        hasMoreOlder
        loadingOlder
        locale="en"
        messages={[message(1), message(2), message(3)]}
        onLoadOlder={onLoadOlder}
        renderRun={(run) => <p>{run.messages[0]?.body}</p>}
        scrollerRef={{ current: null }}
      />,
    );
    Object.defineProperty(live, "scrollTop", { configurable: true, writable: true, value: 0 });
    fireEvent.scroll(live);
    expect(onLoadOlder).not.toHaveBeenCalled();

    rerender(
      <VirtualizedThread
        conversationId="1"
        hasMoreOlder={false}
        loadingOlder={false}
        locale="en"
        messages={[message(1), message(2), message(3)]}
        onLoadOlder={onLoadOlder}
        renderRun={(run) => <p>{run.messages[0]?.body}</p>}
        scrollerRef={{ current: null }}
      />,
    );
    fireEvent.scroll(live);
    expect(onLoadOlder).not.toHaveBeenCalled();

    rerender(
      <VirtualizedThread
        conversationId="2"
        focusMessageId="missing"
        hasMoreOlder
        loadingOlder={false}
        locale="en"
        messages={[message(10), message(11)]}
        onLoadOlder={onLoadOlder}
        renderRun={(run) => <p>{run.messages[0]?.body}</p>}
        scrollerRef={{ current: null }}
      />,
    );
    expect(screen.getByText("m10")).toBeInTheDocument();
  });

  it("restores a saved scroll offset without following output to the bottom", async () => {
    const view = {
      conversationId: "1",
      hasMoreOlder: false,
      loadingOlder: false,
      locale: "en",
      messages: [message(1), message(2), message(3)],
      onLoadOlder: () => undefined,
      renderRun: (run: { messages: Message[] }) => <p>{run.messages[0]?.body}</p>,
      scrollerRef: { current: null as HTMLElement | null },
    };
    const { rerender } = render(<VirtualizedThread {...view} />);
    const scroller = document.querySelector("[data-virtuoso]") as HTMLDivElement;
    Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 0 });
    rerender(<VirtualizedThread {...view} restoreEpoch={1} restoreScrollTop={80} />);
    await flush();
    expect(scroller.scrollTop).toBe(80);
  });

  it("keeps a mid-thread scroll offset when the scroller is pulled back to the bottom", async () => {
    render(
      <VirtualizedThread
        conversationId="1"
        hasMoreOlder={false}
        loadingOlder={false}
        locale="en"
        messages={[message(1), message(2), message(3)]}
        onLoadOlder={() => undefined}
        renderRun={(run) => <p>{run.messages[0]?.body}</p>}
        scrollerRef={{ current: null }}
      />,
    );
    const scroller = document.querySelector("[data-virtuoso]") as HTMLDivElement;
    Object.defineProperty(scroller, "clientHeight", { configurable: true, get: () => 715 });
    Object.defineProperty(scroller, "scrollHeight", { configurable: true, get: () => 4106 });
    Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 80 });
    fireEvent.scroll(scroller);
    scroller.scrollTop = 3391;
    fireEvent.scroll(scroller);
    expect(scroller.scrollTop).toBe(80);
    fireEvent.scroll(scroller);
    expect(scroller.scrollTop).toBe(80);
  });

  it("restores empty-thread scroll, then follows focus and older-page anchors", async () => {
    const onLoadOlder = vi.fn();
    const view = {
      hasMoreOlder: true,
      loadingOlder: false,
      locale: "en",
      onLoadOlder,
      renderRun: (run: { messages: Message[] }) => <p>{run.messages[0]?.body}</p>,
      scrollerRef: (node: HTMLElement | null) => {
        if (node && node.hasAttribute("data-virtuoso")) {
          overflowAt(node, 3391);
        }
      },
    };
    const { rerender } = render(
      <VirtualizedThread
        {...view}
        conversationId="1"
        messages={[]}
        restoreEpoch={1}
        restoreScrollTop={80}
      />,
    );
    const empty = document.querySelector("[data-layer-scroll='1']") as HTMLDivElement;
    overflowAt(empty, 80);
    fireEvent.scroll(empty);
    expect(empty.scrollTop).toBe(80);

    rerender(
      <VirtualizedThread
        {...view}
        conversationId="1"
        messages={[message(1), message(2)]}
        restoreEpoch={1}
        restoreScrollTop={80}
      />,
    );
    const scroller = document.querySelector("[data-virtuoso]") as HTMLDivElement;
    overflowAt(scroller, 80);
    fireEvent.scroll(scroller);
    rerender(
      <VirtualizedThread
        {...view}
        conversationId="1"
        focusMessageId="2"
        messages={[message(1), message(2)]}
        restoreEpoch={1}
        restoreScrollTop={80}
      />,
    );
    await nextFrame();
    await nextFrame();
    overflowAt(scroller, 3391);
    fireEvent.scroll(scroller);

    overflowAt(scroller, 80);
    fireEvent.scroll(scroller);
    rerender(
      <VirtualizedThread
        {...view}
        conversationId="1"
        messages={[message(1), message(2), message(3)]}
        restoreEpoch={2}
        restoreScrollTop={40}
      />,
    );
    overflowAt(scroller, 40);
    fireEvent.scroll(scroller);
    await nextFrame();
    overflowAt(scroller, 12);
    fireEvent.scroll(scroller);
    await nextFrame();
    expect(scroller.scrollTop).toBe(12);

    rerender(
      <VirtualizedThread
        {...view}
        conversationId="3"
        focusMessageId="1"
        messages={[message(1), message(2)]}
      />,
    );
    expect(screen.getByText("m1")).toBeInTheDocument();
  });

  it("does not request older pages while loading or exhausted", () => {
    const onLoadOlder = vi.fn();
    const view = {
      conversationId: "1",
      locale: "en",
      messages: [message(1), message(2)],
      onLoadOlder,
      renderRun: (run: { messages: Message[] }) => <p>{run.messages[0]?.body}</p>,
      scrollerRef: { current: null },
    };
    const { rerender } = render(
      <VirtualizedThread {...view} hasMoreOlder loadingOlder />,
    );
    const scroller = document.querySelector("[data-virtuoso]") as HTMLDivElement;
    Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 0 });
    fireEvent.scroll(scroller);
    expect(onLoadOlder).not.toHaveBeenCalled();

    rerender(<VirtualizedThread {...view} hasMoreOlder={false} loadingOlder={false} />);
    fireEvent.scroll(document.querySelector("[data-virtuoso]") as HTMLDivElement);
    expect(onLoadOlder).not.toHaveBeenCalled();
  });
});
