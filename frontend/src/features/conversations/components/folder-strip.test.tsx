import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FolderStrip } from "./folder-strip";
import { en } from "@/shared/lib/i18n/catalog";

function transfer(id = "") {
  const store = new Map<string, string>();
  if (id) {
    store.set("text/folder-id", id);
  }
  return {
    getData: (type: string) => store.get(type) ?? "",
    setData: (type: string, value: string) => {
      store.set(type, value);
    },
  };
}

describe("FolderStrip", () => {
  it("creates, destroys, and reorders folders", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onCreate = vi.fn();
    const onDestroy = vi.fn();
    const onRename = vi.fn();
    const onReorder = vi.fn();
    const onTabChange = vi.fn();
    const { rerender } = render(
      <FolderStrip
        archivedUnread={2}
        folders={[
          { id: 1, name: "Work", position: 0, conversation_ids: [2] },
          { id: 2, name: "Home", position: 1, conversation_ids: [] },
        ]}
        onCreate={onCreate}
        onDestroy={onDestroy}
        onRename={onRename}
        onReorder={onReorder}
        onTabChange={onTabChange}
        tab="all"
      />,
    );
    expect(screen.getByRole("tab", { name: en.conversations.folders.archived })).toHaveTextContent(
      "2",
    );
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.all }));
    expect(onTabChange).toHaveBeenCalledWith("all");
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.unread }));
    expect(onTabChange).toHaveBeenCalledWith("unread");
    await user.click(screen.getByRole("tab", { name: "Work" }));
    expect(onTabChange).toHaveBeenCalledWith("folder:1");
    await user.click(screen.getByRole("button", { name: en.conversations.folders.create }));
    expect(
      screen.getByRole("dialog", { name: en.conversations.folders.create }),
    ).toBeInTheDocument();
    fireEvent.submit(screen.getByLabelText(en.conversations.folders.name).closest("form")!);
    expect(onCreate).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: en.conversations.folders.create })).toBeNull();
    await user.click(screen.getByRole("button", { name: en.conversations.folders.create }));
    await user.type(screen.getByLabelText(en.conversations.folders.name), "Travel");
    await user.click(screen.getByRole("button", { name: en.conversations.folders.save }));
    expect(onCreate).toHaveBeenCalledWith("Travel");

    rerender(
      <FolderStrip
        archivedUnread={0}
        folders={[
          { id: 1, name: "Work", position: 0, conversation_ids: [2] },
          { id: 2, name: "Home", position: 1, conversation_ids: [] },
        ]}
        onCreate={onCreate}
        onDestroy={onDestroy}
        onRename={onRename}
        onReorder={onReorder}
        onTabChange={onTabChange}
        tab="folder:1"
      />,
    );
    const work = screen.getByRole("tab", { name: "Work" });
    const home = screen.getByRole("tab", { name: "Home" });
    fireEvent.contextMenu(work, { clientX: 12, clientY: 18 });
    await user.click(screen.getByRole("menuitem", { name: en.conversations.folders.rename }));
    expect(
      screen.getByRole("dialog", { name: en.conversations.folders.rename }),
    ).toBeInTheDocument();
    const renameInput = screen.getByLabelText(en.conversations.folders.rename_name);
    await user.clear(renameInput);
    await user.click(screen.getByRole("button", { name: en.conversations.folders.rename_save }));
    expect(onRename).not.toHaveBeenCalled();
    await user.type(renameInput, "Office");
    await user.click(screen.getByRole("button", { name: en.conversations.folders.rename_save }));
    expect(onRename).toHaveBeenCalledWith(1, "Office");

    fireEvent.contextMenu(home, { clientX: 12, clientY: 18 });
    await user.click(screen.getByRole("button", { name: en.ui.close }));
    fireEvent.contextMenu(home, { clientX: 12, clientY: 18 });
    await user.click(screen.getByRole("menuitem", { name: en.conversations.folders.delete }));
    expect(onDestroy).not.toHaveBeenCalled();
    expect(
      screen.getByText(en.conversations.folders.delete_description.replace("{{name}}", "Home")),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: en.ui.cancel }));
    fireEvent.contextMenu(home, { clientX: 12, clientY: 18 });
    await user.click(screen.getByRole("menuitem", { name: en.conversations.folders.delete }));
    await user.keyboard("{Escape}");
    fireEvent.contextMenu(home, { clientX: 12, clientY: 18 });
    await user.click(screen.getByRole("menuitem", { name: en.conversations.folders.delete }));
    await user.click(screen.getByRole("button", { name: en.conversations.folders.delete }));
    expect(onDestroy).toHaveBeenCalledWith(2);

    const data = transfer();
    fireEvent.dragStart(work, { dataTransfer: data });
    fireEvent.dragOver(home);
    fireEvent.drop(home, { dataTransfer: data });
    expect(onReorder).toHaveBeenCalledWith([2, 1]);
    fireEvent.drop(home, { dataTransfer: transfer() });
    expect(onReorder).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.archived }));
    expect(onTabChange).toHaveBeenCalledWith("archived");
  });

  it("opens a custom-folder menu on touch long press", () => {
    vi.useFakeTimers();
    const onTabChange = vi.fn();
    const view = render(
      <FolderStrip
        archivedUnread={0}
        folders={[{ id: 1, name: "Work", position: 0, conversation_ids: [] }]}
        onCreate={vi.fn()}
        onDestroy={vi.fn()}
        onRename={vi.fn()}
        onReorder={vi.fn()}
        onTabChange={onTabChange}
        tab="all"
      />,
    );
    const work = screen.getByRole("tab", { name: "Work" });
    fireEvent.pointerDown(work, { button: 1, pointerType: "touch" });
    fireEvent.pointerDown(work, { button: 0, pointerType: "mouse" });
    fireEvent.pointerDown(work, {
      button: 0,
      clientX: 24,
      clientY: 30,
      pointerType: "touch",
    });
    fireEvent.pointerMove(work, { clientX: 40, clientY: 30, pointerType: "touch" });
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole("menuitem", { name: en.conversations.folders.rename })).toBeNull();
    fireEvent.pointerDown(work, {
      button: 0,
      clientX: 24,
      clientY: 30,
      pointerType: "touch",
    });
    fireEvent.pointerMove(work, { clientX: 24, clientY: 45, pointerType: "touch" });
    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByRole("menuitem", { name: en.conversations.folders.rename })).toBeNull();
    fireEvent.pointerDown(work, {
      button: 0,
      clientX: 24,
      clientY: 30,
      pointerType: "touch",
    });
    act(() => vi.advanceTimersByTime(400));
    expect(
      screen.getByRole("menuitem", { name: en.conversations.folders.rename }),
    ).toBeInTheDocument();
    fireEvent.pointerUp(work);
    fireEvent.click(work);
    expect(onTabChange).not.toHaveBeenCalled();
    fireEvent.pointerDown(work, {
      button: 0,
      clientX: 24,
      clientY: 30,
      pointerType: "touch",
    });
    view.unmount();
    vi.useRealTimers();
  });
});
