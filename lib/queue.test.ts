import { describe, it, expect } from "vitest";
import { makeQueue } from "./queue";

describe("recovering write queue", () => {
  it("a rejected write does not block later writes, and each caller sees its own result", async () => {
    const q = makeQueue();
    const ran: string[] = [];
    const a = q("k", async () => {
      ran.push("a");
      throw new Error("boom");
    });
    const b = q("k", async () => {
      ran.push("b");
    });
    await expect(a).rejects.toThrow("boom");
    await expect(b).resolves.toBeUndefined();
    expect(ran).toEqual(["a", "b"]);
  });

  it("keeps separate keys independent", async () => {
    const q = makeQueue();
    await expect(q("k1", async () => undefined)).resolves.toBeUndefined();
    await expect(q("k2", async () => undefined)).resolves.toBeUndefined();
  });
});
