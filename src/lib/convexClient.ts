/**
 * Shared Convex client instance.
 * Imported by both the React provider (main.tsx) and client-side utilities
 * that need to call Convex actions outside of React hooks.
 */
import { ConvexReactClient } from "convex/react";

let _client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient {
  if (!_client) {
    _client = new ConvexReactClient(
      import.meta.env.VITE_CONVEX_URL as string,
    );
  }
  return _client;
}
