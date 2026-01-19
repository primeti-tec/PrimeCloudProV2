import { describe, it, expect } from "vitest";
import { buildUrl } from "./routes";

describe("buildUrl", () => {
  it("should return path unchanged when no params provided", () => {
    const path = "/api/products";
    expect(buildUrl(path)).toBe("/api/products");
  });

  it("should return path unchanged when params object is empty", () => {
    const path = "/api/products";
    expect(buildUrl(path, {})).toBe("/api/products");
  });

  it("should replace single path parameter", () => {
    const path = "/api/accounts/:id";
    const params = { id: "123" };
    expect(buildUrl(path, params)).toBe("/api/accounts/123");
  });

  it("should replace multiple path parameters", () => {
    const path = "/api/accounts/:accountId/members/:memberId";
    const params = { accountId: "456", memberId: "789" };
    expect(buildUrl(path, params)).toBe("/api/accounts/456/members/789");
  });

  it("should handle numeric parameter values", () => {
    const path = "/api/accounts/:id";
    const params = { id: 123 };
    expect(buildUrl(path, params)).toBe("/api/accounts/123");
  });

  it("should handle mix of string and numeric parameter values", () => {
    const path = "/api/accounts/:accountId/orders/:orderId";
    const params = { accountId: 100, orderId: "order-456" };
    expect(buildUrl(path, params)).toBe("/api/accounts/100/orders/order-456");
  });

  it("should ignore params that don't match path parameters", () => {
    const path = "/api/accounts/:id";
    const params = { id: "123", extra: "unused" };
    expect(buildUrl(path, params)).toBe("/api/accounts/123");
  });

  it("should leave unreplaced parameters in path if not provided", () => {
    const path = "/api/accounts/:accountId/members/:memberId";
    const params = { accountId: "123" };
    expect(buildUrl(path, params)).toBe("/api/accounts/123/members/:memberId");
  });

  it("should handle paths with no parameters but params provided", () => {
    const path = "/api/products";
    const params = { id: "123" };
    expect(buildUrl(path, params)).toBe("/api/products");
  });

  it("should handle zero as a parameter value", () => {
    const path = "/api/accounts/:id";
    const params = { id: 0 };
    expect(buildUrl(path, params)).toBe("/api/accounts/0");
  });

  it("should handle empty string as a parameter value", () => {
    const path = "/api/accounts/:id";
    const params = { id: "" };
    expect(buildUrl(path, params)).toBe("/api/accounts/");
  });

  it("should handle complex paths with multiple segments", () => {
    const path = "/api/accounts/:accountId/access-keys/:keyId/rotate";
    const params = { accountId: "acc-123", keyId: "key-456" };
    expect(buildUrl(path, params)).toBe("/api/accounts/acc-123/access-keys/key-456/rotate");
  });

  it("should handle paths with similar parameter names", () => {
    const path = "/api/:id/:identifier";
    const params = { id: "first", identifier: "second" };
    expect(buildUrl(path, params)).toBe("/api/first/second");
  });

  it("should only replace exact parameter matches (with colon prefix)", () => {
    const path = "/api/accounts/:id/id";
    const params = { id: "123" };
    expect(buildUrl(path, params)).toBe("/api/accounts/123/id");
  });
});
