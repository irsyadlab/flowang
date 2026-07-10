import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useCategoryStore } from "../../src/stores/categoryStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";
import type { Category } from "../../src/types";

function resetStores() {
  useCategoryStore.setState({ categories: [], isLoading: false, error: null });
}

describe("categoryStore", () => {
  beforeEach(async () => {
    resetStores();
    await resetDB();
    useUIStore.getState().setDbReady(true);
  });

  afterEach(() => {
    resetStores();
    useUIStore.getState().setDbReady(false);
    closeDB();
  });

  describe("loadCategories", () => {
    it("loads categories from DB", async () => {
      const db = (await import("../../src/db/db")).getDB()!;
      const cat: Category = {
        id: crypto.randomUUID(),
        name: "Makan",
        type: "expense",
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      const { addCategory } = await import("../../src/db/categoryDb");
      await addCategory(db, cat);

      await useCategoryStore.getState().loadCategories();
      expect(useCategoryStore.getState().categories.length).toBe(1);
      expect(useCategoryStore.getState().categories[0].name).toBe("Makan");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useCategoryStore.getState().loadCategories();
      expect(useCategoryStore.getState().categories.length).toBe(0);
    });
  });

  describe("addCategory", () => {
    it("adds a category and updates state", async () => {
      await useCategoryStore.getState().addCategory({ name: "Transport", type: "expense" });
      const cats = useCategoryStore.getState().categories;
      expect(cats.length).toBe(1);
      expect(cats[0].name).toBe("Transport");
      expect(cats[0].type).toBe("expense");
      expect(cats[0].id).toBeDefined();
    });

    it("sets isDefault to false by default", async () => {
      await useCategoryStore.getState().addCategory({ name: "Test", type: "income" });
      expect(useCategoryStore.getState().categories[0].isDefault).toBe(false);
    });

    it("respects isDefault when provided", async () => {
      await useCategoryStore.getState().addCategory({ name: "Default", type: "both", isDefault: true });
      expect(useCategoryStore.getState().categories[0].isDefault).toBe(true);
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useCategoryStore.getState().addCategory({ name: "Test", type: "expense" });
      expect(useCategoryStore.getState().categories.length).toBe(0);
    });
  });

  describe("updateCategory", () => {
    it("updates category name", async () => {
      await useCategoryStore.getState().addCategory({ name: "Old", type: "expense" });
      const id = useCategoryStore.getState().categories[0].id;

      await useCategoryStore.getState().updateCategory(id, { name: "New" });
      expect(useCategoryStore.getState().categories[0].name).toBe("New");
    });

    it("sets error when category not found", async () => {
      await useCategoryStore.getState().updateCategory("nonexistent", { name: "Test" });
      expect(useCategoryStore.getState().error).toContain("not found");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useCategoryStore.getState().updateCategory("any", { name: "Test" });
      expect(useCategoryStore.getState().error).toBeNull();
    });
  });

  describe("deleteCategory", () => {
    it("deletes a non-default category", async () => {
      await useCategoryStore.getState().addCategory({ name: "Temp", type: "expense" });
      const id = useCategoryStore.getState().categories[0].id;

      await useCategoryStore.getState().deleteCategory(id);
      expect(useCategoryStore.getState().categories.length).toBe(0);
    });

    it("rejects deletion of default category", async () => {
      await useCategoryStore.getState().addCategory({ name: "Default", type: "expense", isDefault: true });
      const id = useCategoryStore.getState().categories[0].id;

      await useCategoryStore.getState().deleteCategory(id);
      expect(useCategoryStore.getState().error).toContain("default");
      expect(useCategoryStore.getState().categories.length).toBe(1);
    });

    it("sets error when category not found", async () => {
      await useCategoryStore.getState().deleteCategory("nonexistent");
      expect(useCategoryStore.getState().error).toContain("not found");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useCategoryStore.getState().deleteCategory("any");
      expect(useCategoryStore.getState().categories.length).toBe(0);
    });
  });
});
