import type { MessageKey } from "@/lib/i18n/dictionaries";
import { dictionaries } from "@/lib/i18n/dictionaries";

/** Map database error codes (raised by the transactional functions) to translated keys. */
export function errorKey(err: unknown): MessageKey {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : String(err);
  const code = msg.match(/[A-Z_]{6,}/)?.[0];
  const key = `err.${code}` as MessageKey;
  return code && key in dictionaries.es ? key : "auth.errorGeneric";
}
