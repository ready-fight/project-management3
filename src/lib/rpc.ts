import { hc } from "hono/client";

import { AppType } from "@/app/api/[[...route]]/route";

// In the browser always call the API on the deployment currently being viewed.
// This avoids stale NEXT_PUBLIC_APP_URL values causing cross-origin requests after
// Vercel preview/production URLs change.
const apiOrigin =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const client = hc<AppType>(apiOrigin);
