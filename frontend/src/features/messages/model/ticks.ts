import type { Message } from "@/features/conversations/api/http";
import type { TickStatus } from "@/features/messages/model/constants";

export function tickStatus(message: Message): TickStatus | undefined {
  if (message.id < 0) {
    return "queued";
  }
  if (message.tick === "sent" || message.tick === "delivered" || message.tick === "read") {
    return message.tick;
  }
  return undefined;
}
