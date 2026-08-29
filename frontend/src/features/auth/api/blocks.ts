import { apiClient, bearerHeaders, unwrap } from "@/features/auth/api/http";

export async function listBlocks() {
  return unwrap(
    await apiClient().GET("/api/v1/blocks", { headers: bearerHeaders() }),
    "blocks_failed",
  );
}

export async function createBlock(accountId: number) {
  return unwrap(
    await apiClient().POST("/api/v1/blocks", {
      headers: bearerHeaders(),
      body: { account_id: accountId },
    }),
    "block_create_failed",
  );
}

export async function destroyBlock(accountId: number) {
  return unwrap(
    await apiClient().DELETE("/api/v1/blocks/{id}", {
      headers: bearerHeaders(),
      params: { path: { id: accountId } },
    }),
    "block_destroy_failed",
  );
}
