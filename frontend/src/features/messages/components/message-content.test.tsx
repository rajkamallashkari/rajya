import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/messages/model/highlight", () => ({
  highlightCode: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/features/messages/model/copy-text", () => ({
  copyText: vi.fn().mockResolvedValue(true),
}));

import { copyText } from "@/features/messages/model/copy-text";
import { highlightCode } from "@/features/messages/model/highlight";
import { CodeBlock } from "./code-block";
import { MessageContent, MessageSpan } from "./message-content";
import { en } from "@/shared/lib/i18n/catalog";

describe("MessageContent", () => {
  beforeEach(() => {
    vi.mocked(highlightCode).mockResolvedValue(null);
    vi.mocked(copyText).mockResolvedValue(true);
  });

  it("renders the same tree for identical input", () => {
    const body =
      "**Bold** *italic* ~~strike~~ `code`\n\n- item\n\n1. one\n\n> quote\n\n[Rajya](https://rajya.pages.dev)";
    const first = render(<MessageContent body={body} />);
    const second = render(<MessageContent body={body} />);
    const a = first.container.querySelector("[data-message-content]")?.innerHTML;
    const b = second.container.querySelector("[data-message-content]")?.innerHTML;
    expect(a).toBe(b);
    expect(first.container).toHaveTextContent("Bold");
    expect(first.container.querySelector("blockquote")).not.toBeNull();
    expect(first.container.querySelector("ul")).not.toBeNull();
    expect(first.container.querySelector("ol")).not.toBeNull();
    expect(first.container.querySelector("a")).toHaveAttribute("href", "https://rajya.pages.dev");
  });

  it("renders headings, tables, and HTML literally", () => {
    const { container } = render(<MessageContent body={"# heading\n\n| a | b |\n\n<b>html</b>"} />);
    expect(container.querySelector("h1")).toBeNull();
    expect(container.querySelector("table")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    expect(container).toHaveTextContent("# heading");
    expect(container).toHaveTextContent("| a | b |");
    expect(container).toHaveTextContent("<b>html</b>");
  });

  it("hides spoilers until tapped and remounts hidden on reset (NR-18)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MessageContent body="see ||secret|| now" resetKey="one" />);
    const spoiler = screen.getByRole("button", { name: en.messages.spoiler.hidden });
    expect(spoiler).toHaveAttribute("data-spoiler", "hidden");
    await user.click(spoiler);
    expect(screen.getByRole("button", { name: en.messages.spoiler.revealed })).toHaveAttribute(
      "data-spoiler",
      "revealed",
    );
    rerender(<MessageContent body="see ||secret|| now" resetKey="two" />);
    expect(screen.getByRole("button", { name: en.messages.spoiler.hidden })).toHaveAttribute(
      "data-spoiler",
      "hidden",
    );
  });

  it("renders jumbo emoji, mentions, nested quotes, and fenced code", async () => {
    const user = userEvent.setup();
    const mentions: string[] = [];
    const { container, rerender } = render(<MessageContent body="🎉" />);
    expect(container.querySelector("[data-jumbo='1']")).not.toBeNull();

    rerender(
      <MessageContent
        body={"> outer\n> > inner\n\nhello @ada\n\n```javascript\nconst ok = 1;\n```"}
        onMentionClick={(handle) => mentions.push(handle)}
      />,
    );
    expect(container.querySelectorAll("blockquote")).toHaveLength(1);
    await user.click(
      screen.getByRole("button", { name: en.messages.mention.replace("{{handle}}", "ada") }),
    );
    expect(mentions).toEqual(["ada"]);
    rerender(<MessageContent body={"[@ada](https://rajya.pages.dev) and ||x||"} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://rajya.pages.dev");
    expect(screen.getByRole("button", { name: en.messages.spoiler.hidden })).toBeInTheDocument();
  });

  it("renders a mention without a click handler", () => {
    render(<MessageContent body="@ada" />);
    expect(
      screen.queryByRole("button", { name: en.messages.mention.replace("{{handle}}", "ada") }),
    ).toBeNull();
    expect(screen.getByText("@ada")).toBeInTheDocument();
  });

  it("classifies plain, hyphenated spoiler, and non-string mention spans", () => {
    const { rerender } = render(<MessageSpan>plain</MessageSpan>);
    expect(screen.getByText("plain").tagName).toBe("SPAN");
    rerender(<MessageSpan data-spoiler="">hid</MessageSpan>);
    expect(screen.getByRole("button", { name: en.messages.spoiler.hidden })).toBeInTheDocument();
    rerender(<MessageSpan dataSpoiler="">hid2</MessageSpan>);
    expect(screen.getByRole("button", { name: en.messages.spoiler.hidden })).toBeInTheDocument();
    rerender(
      <MessageSpan data-mention="ada">
        {en.messages.mention.replace("{{handle}}", "ada")}
      </MessageSpan>,
    );
    expect(screen.getByText("@ada")).toBeInTheDocument();
    rerender(<MessageSpan dataMention={1}>x</MessageSpan>);
    expect(screen.getByText("x").tagName).toBe("SPAN");
  });

  it("stops link navigation from bubbling", async () => {
    const user = userEvent.setup();
    let bubbled = false;
    render(
      <div
        onClick={() => {
          bubbled = true;
        }}
      >
        <MessageContent body={"[go](https://rajya.pages.dev)"} />
      </div>,
    );
    await user.click(screen.getByRole("link"));
    expect(bubbled).toBe(false);
  });
});

describe("CodeBlock", () => {
  it("copies, shows highlighted html, and ignores stale results", async () => {
    const user = userEvent.setup();
    vi.mocked(highlightCode).mockResolvedValue("<pre>hi</pre>");
    const { rerender, unmount } = render(<CodeBlock code="hi" lang="js" />);
    expect(await screen.findByRole("button", { name: en.messages.code.copy })).toBeInTheDocument();
    await waitFor(() => {
      expect(
        document.querySelector(".message-code div[dangerouslysetinnerhtml], .message-code pre"),
      ).not.toBeNull();
    });
    await user.click(screen.getByRole("button", { name: en.messages.code.copy }));
    expect(copyText).toHaveBeenCalledWith("hi");
    expect(
      await screen.findByRole("button", { name: en.messages.code.copied }),
    ).toBeInTheDocument();

    vi.mocked(copyText).mockResolvedValue(false);
    rerender(<CodeBlock code="nope" lang="js" />);
    await user.click(screen.getByRole("button", { name: en.messages.code.copy }));
    expect(screen.queryByRole("button", { name: en.messages.code.copied })).toBeNull();

    let resolve!: (value: string | null) => void;
    vi.mocked(highlightCode).mockReturnValue(
      new Promise((next) => {
        resolve = next;
      }),
    );
    unmount();
    render(<CodeBlock code="late" lang="js" />);
    const { unmount: unmountLate } = render(<CodeBlock code="late" lang="js" />);
    unmountLate();
    resolve("<pre>late</pre>");
    await Promise.resolve();
  });
});
