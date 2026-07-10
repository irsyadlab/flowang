import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { closeDB } from "../../src/db/db";
import { useLoanContactStore } from "../../src/stores/loanContactStore";
import { useUIStore } from "../../src/stores/uiStore";
import { resetDB } from "../helpers/dbHelpers";

function resetStores() {
  useLoanContactStore.setState({ contacts: [], isLoading: false, error: null });
}

describe("loanContactStore", () => {
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

  describe("loadContacts", () => {
    it("loads contacts from DB", async () => {
      await useLoanContactStore.getState().addContact({ name: "Alice" });
      useLoanContactStore.setState({ contacts: [] });

      await useLoanContactStore.getState().loadContacts();
      expect(useLoanContactStore.getState().contacts.length).toBe(1);
      expect(useLoanContactStore.getState().contacts[0].name).toBe("Alice");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanContactStore.getState().loadContacts();
      expect(useLoanContactStore.getState().contacts.length).toBe(0);
    });
  });

  describe("addContact", () => {
    it("adds a contact and updates state", async () => {
      await useLoanContactStore.getState().addContact({ name: "Bob" });
      const contacts = useLoanContactStore.getState().contacts;
      expect(contacts.length).toBe(1);
      expect(contacts[0].name).toBe("Bob");
      expect(contacts[0].id).toBeDefined();
      expect(contacts[0].createdAt).toBeDefined();
      expect(contacts[0].updatedAt).toBeDefined();
    });

    it("adds contact with note", async () => {
      await useLoanContactStore.getState().addContact({ name: "Charlie", note: "Teman kantor" });
      expect(useLoanContactStore.getState().contacts[0].note).toBe("Teman kantor");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanContactStore.getState().addContact({ name: "Test" });
      expect(useLoanContactStore.getState().contacts.length).toBe(0);
    });
  });

  describe("addContactAndGetId", () => {
    it("returns the new contact id", async () => {
      const id = await useLoanContactStore.getState().addContactAndGetId({ name: "Dave" });
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
      expect(useLoanContactStore.getState().contacts[0].id).toBe(id);
    });

    it("throws when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await expect(
        useLoanContactStore.getState().addContactAndGetId({ name: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("updateContact", () => {
    it("updates contact name", async () => {
      await useLoanContactStore.getState().addContact({ name: "Old Name" });
      const id = useLoanContactStore.getState().contacts[0].id;

      await useLoanContactStore.getState().updateContact(id, { name: "New Name" });
      expect(useLoanContactStore.getState().contacts[0].name).toBe("New Name");
    });

    it("sets error when contact not found", async () => {
      await useLoanContactStore.getState().updateContact("nonexistent", { name: "Test" });
      expect(useLoanContactStore.getState().error).toContain("not found");
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanContactStore.getState().updateContact("any", { name: "Test" });
      expect(useLoanContactStore.getState().error).toBeNull();
    });
  });

  describe("deleteContact", () => {
    it("deletes a contact", async () => {
      await useLoanContactStore.getState().addContact({ name: "To Delete" });
      const id = useLoanContactStore.getState().contacts[0].id;

      await useLoanContactStore.getState().deleteContact(id);
      expect(useLoanContactStore.getState().contacts.length).toBe(0);
    });

    it("does nothing when dbReady is false", async () => {
      useUIStore.getState().setDbReady(false);
      await useLoanContactStore.getState().deleteContact("any");
      expect(useLoanContactStore.getState().contacts.length).toBe(0);
    });
  });
});
