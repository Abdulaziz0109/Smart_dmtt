import { describe, expect, it } from "vitest";
import { canAccessKindergarten } from "../src/lib/rbac";

describe("rbac", () => {
  it("director cannot access another kindergarten", () => {
    expect(canAccessKindergarten("kindergarten_director", "kg1", "kg2")).toBe(false);
  });
});
