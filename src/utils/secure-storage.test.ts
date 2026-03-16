import { afterEach, describe, expect, it } from "vitest";

import { getBrowserFingerprint } from "./secure-storage";

describe("secure-storage", () => {
  describe("getBrowserFingerprint", () => {
    const originalWidth = window.screen.width;
    const originalHeight = window.screen.height;

    afterEach(() => {
      // Restore screen dimensions
      Object.defineProperty(window.screen, "width", {
        configurable: true,
        value: originalWidth,
        writable: true,
      });
      Object.defineProperty(window.screen, "height", {
        configurable: true,
        value: originalHeight,
        writable: true,
      });
    });

    it("should produce stable fingerprint regardless of screen dimensions", async () => {
      // Get fingerprint with current screen
      const fingerprint1 = await getBrowserFingerprint();

      // Change screen dimensions (simulating monitor change)
      Object.defineProperty(window.screen, "width", {
        configurable: true,
        value: 3840,
        writable: true,
      });
      Object.defineProperty(window.screen, "height", {
        configurable: true,
        value: 2160,
        writable: true,
      });

      // Get fingerprint again — should be identical
      const fingerprint2 = await getBrowserFingerprint();

      expect(fingerprint1).toBe(fingerprint2);
    });

    it("should return a hex string", async () => {
      const fingerprint = await getBrowserFingerprint();
      expect(fingerprint).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("secureStorage (plaintext fallback in test mode)", () => {
    it("should round-trip a value", async () => {
      const { secureStorage } = await import("./secure-storage");
      await secureStorage.setItem("test-key", "test-value");
      const retrieved = await secureStorage.getItem("test-key");
      expect(retrieved).toBe("test-value");
      localStorage.removeItem("secure_test-key");
    });

    it("should return null for non-existent key", async () => {
      const { secureStorage } = await import("./secure-storage");
      const retrieved = await secureStorage.getItem("nonexistent");
      expect(retrieved).toBeNull();
    });
  });
});
