import registry from "@/shared/lib/config/settings-registry.json";

export const MESSAGE_PAGE_SIZE = registry.message_page_size.default as number;
export const JUMP_WINDOW = registry.jump_window.default as number;
export const JUMP_HALF_WINDOW = Math.floor(JUMP_WINDOW / 2);
export const CLIENT_CACHE_SIZE = registry.client_cache_size.default as number;
