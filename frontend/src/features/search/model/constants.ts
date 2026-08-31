import registry from "@/shared/lib/config/settings-registry.json";
import { MS_PER_SECOND } from "@/features/conversations/model/constants";

export { SEARCH_FIXTURE_NEEDLE, SEARCH_THREAD_FILLER_COUNT } from "@/features/search/model/fixture";

export const SEARCH_MIN_QUERY_LENGTH = registry.search_min_query_length.default as number;
export const SEARCH_DEBOUNCE_MS = registry.search_debounce.default as number;
export const MS_PER_DAY = MS_PER_SECOND * 60 * 60 * 24;
export const SEARCH_WEEK_DAYS = 7;
