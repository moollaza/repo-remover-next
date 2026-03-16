import { setupServer } from "msw/node";

import { handlers } from "@/mocks/handlers";

// Shared MSW server instance for all unit/integration tests.
// Import this in test files that need runtime handler overrides via server.use().
export const server = setupServer(...handlers);
