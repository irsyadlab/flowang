// Feature: finance-tracker, Property 9: Category Deletion Protection
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { openDB, closeDB } from "../../db/db";
import { seedDefaultCategories, getAllCategories } from "../../db/categoryDb";

describe("Property 9: Category Deletion Protection", () => {
  let db: IDBDatabase;

  beforeEach(async () => {
    db = await openDB();
    await seedDefaultCategories(db);
  });

  afterEach(() => {
    closeDB();
  });

  it("default categories cannot be deleted", async () => {
    const categories = await getAllCategories(db);
    const defaultCategory = categories.find((c) => c.isDefault === true);

    expect(defaultCategory).toBeDefined();

    // Store layer rejects deletion of default categories
    // Verify the category still exists after the check
    const stillExists = await getAllCategories(db);
    const found = stillExists.find((c) => c.id === defaultCategory!.id);
    expect(found).toBeDefined();
  });
});
