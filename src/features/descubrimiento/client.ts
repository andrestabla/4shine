import { requestApi } from "@/lib/api-client";
import type {
  DiscoverySessionRecord,
  UpdateDiscoverySessionInput,
} from "./types";

export type { DiscoverySessionRecord, UpdateDiscoverySessionInput } from "./types";

export async function getDiscoverySession(): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/session",
  );
}

export async function updateDiscoverySessionRequest(
  input: UpdateDiscoverySessionInput,
): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/session",
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function resetDiscoverySessionRequest(): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/session",
    {
      method: "DELETE",
    },
  );
}

export async function shareDiscoverySessionRequest(
  input: UpdateDiscoverySessionInput,
): Promise<DiscoverySessionRecord> {
  return requestApi<DiscoverySessionRecord>(
    "/api/v1/modules/descubrimiento/share",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

