// Feature: finance-tracker, Integration: Default Categories
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../db/db";
import { seedDefaultCategories, getAllCategories } from "../../db/categoryDb";

const EXPECTED_DEFAULTS = [
  { name: "Makanan & Minuman", type: "expense" },
  { name: "Transportasi", type: "expense" },
  { name: "Belanja", type: "expense" },
  { name: "Kesehatan", type: "expense" },
  { name: "Hiburan", type: "expense" },
  { name: "Gaji", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Investasi", type: "income" },
  { name: "Hadiah", type: "income" },
];

describe("Default Categories", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
    await seedDefaultCategories(db);
  });

  afterEach(() => {
    closeDB();
  });

  it("exactly 9 default categories are seeded with correct names and types", async () => {
    const categories = await getAllCategories(db);

    expect(categories.length).toBe(9);

    for (const expected of EXPECTED_DEFAULTS) {
      const found = categories.find(
        (c) => c.name === expected.name && c.type === expected.type
      );
      expect(found).toBeDefined();
      expect(found!.isDefault).toBe(true);
    }
  });
});
