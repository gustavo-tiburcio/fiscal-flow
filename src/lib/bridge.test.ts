import { afterEach, expect, test } from "bun:test";
import { db } from "./bridge";

const originalWindow = globalThis.window;
afterEach(() => {
  if (originalWindow) globalThis.window = originalWindow;
  else Reflect.deleteProperty(globalThis, "window");
});

test("reset removes all fiscal records while preserving unrelated storage", async () => {
  const items = new Map<string, string>([
    ["fiscal.local.v1", JSON.stringify({ accountant: { fullName: "Teste Contador" }, companies: [{ id: 1 }], invoices: [{ id: 1, companyId: 1 }] })],
    ["unrelated", "keep"],
  ]);
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value: {
    localStorage: { getItem: (key: string) => items.get(key) ?? null, removeItem: (key: string) => items.delete(key) },
  } });
  await db.resetData();
  expect(await db.getAccountant()).toBeNull();
  expect(await db.listCompanies()).toEqual([]);
  expect(await db.listInvoices()).toEqual([]);
  expect(items.has("fiscal.local.v1")).toBe(false);
  expect(items.get("unrelated")).toBe("keep");
});

test("desktop reset uses IPC rather than web storage", async () => {
  let calls = 0;
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value: {
    fiscal: { resetData: async () => { calls++; } },
    localStorage: { removeItem: () => { throw new Error("Must not clear web data instead of desktop data"); } },
  } });
  await db.resetData();
  expect(calls).toBe(1);
});