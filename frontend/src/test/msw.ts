import { setupServer } from "msw/node";
import { handlers } from "@/shared/lib/api/msw/handlers";

export const server = setupServer(...handlers);
