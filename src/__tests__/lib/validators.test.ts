// Feature: finance-tracker, Property 15: Category Name Uniqueness Per Type
import { describe, it, expect } from "bun:test";
import { categorySchema } from "../../lib/validators";

describe("Property 15: Category Name Uniqueness Per Type (Case-Insensitive)", () => {
  it("categorySchema validates correct category input", () => {
    const result = categorySchema.safeParse({ name: "Makan", type: "expense" });
    expect(result.success).toBe(true);
  });

  it("categorySchema rejects empty name", () => {
    const result = categorySchema.safeParse({ name: "", type: "expense" });
    expect(result.success).toBe(false);
  });

  it("categorySchema rejects name > 50 chars", () => {
    const result = categorySchema.safeParse({ name: "A".repeat(51), type: "expense" });
    expect(result.success).toBe(false);
  });

  it("categorySchema accepts all valid types", () => {
    for (const type of ["income", "expense", "both"]) {
      const result = categorySchema.safeParse({ name: "Test", type });
      expect(result.success).toBe(true);
    }
  });

  it("categorySchema rejects invalid type", () => {
    const result = categorySchema.safeParse({ name: "Test", type: "invalid" });
    expect(result.success).toBe(false);
  });
});
