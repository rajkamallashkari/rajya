import { fireEvent, render, screen } from "@testing-library/react";
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
        onReorder={onReorder}
        onTabChange={onTabChange}
        tab="all"
      />,
    );
    expect(screen.getByRole("tab", { name: en.conversations.folders.archived })).toHaveTextContent("2");
    await user.click(screen.getByRole("tab", { name: en.conversations.folders.unread }));
    expect(onTabChange).toHaveBeenCalledWith("unread");
    await user.click(screen.getByRole("tab", { name: "Work" }));
    expect(onTabChange).toHaveBeenCalledWith("folder:1");
    await user.click(screen.getByRole("button", { name: en.conversations.folders.create }));
    await user.click(screen.getByRole("button", { name: en.conversations.folders.save }));
    expect(onCreate).not.toHaveBeenCalled();
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
        onReorder={onReorder}
        onTabChange={onTabChange}
        tab="folder:1"
      />,
    );
    await user.click(screen.getByRole("button", { name: en.conversations.folders.delete }));
    expect(onDestroy).toHaveBeenCalledWith(1);

    const work = screen.getByRole("tab", { name: "Work" });
    const home = screen.getByRole("tab", { name: "Home" });
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
});
