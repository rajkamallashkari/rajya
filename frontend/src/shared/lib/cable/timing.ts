import registry from "@/shared/lib/config/settings-registry.json";

export const RECONNECT_DELAY_MS = registry.reconnect_delay.default as number;
export const RECONNECT_POLL_MS = registry.reconnect_poll.default as number;
export const CONNECTION_POLL_MS = registry.connection_poll.default as number;
export const UNMOUNT_GRACE_MS = 100;
