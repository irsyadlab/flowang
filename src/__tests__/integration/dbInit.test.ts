// Feature: finance-tracker, Integration: DB Initialization
import "fake-indexeddb/auto";
import { describe, it, expect, afterEach } from "bun:test";
import { openDB, closeDB } from "../../db/db";

describe("DB Initialization", () => {
  afterEach(() => {
    closeDB();
  });

  it("smoke: DB can be opened and all object stores exist", async () => {
    const db = await openDB();

    expect(db).toBeDefined();
    expect(db.objectStoreNames.contains("wallets")).toBe(true);
    expect(db.objectStoreNames.contains("transactions")).toBe(true);
    expect(db.objectStoreNames.contains("categories")).toBe(true);

    db.close();
  });
});
