import { fireEvent, render, screen } from "@testing-library/react";
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
    Object.defineProperty(live, "scrollTop", { configurable: true, writable: true, value: 40 });
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
