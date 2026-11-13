import { createServerFn } from "@tanstack/react-start";

// The Google key is a browser key restricted by website and API in the owner's
// Google Cloud (ADR-003); it is meant to reach the browser, so returning it is safe.
export const getMapsBrowserKey = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["Google_Maps_API_Key"];
  return { key: key ?? null };
});
