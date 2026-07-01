import type { Message, ScrollPayload } from "./types";

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

export function isScrollPayload(v: unknown): v is ScrollPayload {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.host === "string" &&
    typeof o.dateKey === "string" &&
    isNum(o.totalPx) &&
    isNum(o.downPx) &&
    isNum(o.downViewports) &&
    isNum(o.maxDepthPx) &&
    isNum(o.events) &&
    isNum(o.startedAt) &&
    isNum(o.lastSeenAt)
  );
}

export function isScrollMessage(v: unknown): v is Message {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return o.type === "scroll-flush" && isScrollPayload(o.payload);
}
