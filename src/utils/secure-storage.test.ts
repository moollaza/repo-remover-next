import { afterEach, describe, expect, it, vi } from "vitest";

import { secureStorage } from "@/utils/secure-storage";

describe("secureStorage", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("setItem (test mode — plain storage)", () => {
    it("stores value in localStorage with secure_ prefix", async () => {
      await secureStorage.setItem("pat", "ghp_test123");
      expect(localStorage.getItem("secure_pat")).toBe("ghp_test123");
    });
  });

  describe("setItem (production mode — encrypted storage)", () => {
    it("survives browser userAgent change (e.g. auto-update)", async () => {
      // Switch to production mode so real encryption is used
      vi.stubEnv("MODE", "production");

      // Store a value with current userAgent
      await secureStorage.setItem("pat", "ghp_stable_token");

      // Simulate a browser auto-update changing the userAgent string
      vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/999.0.0.0",
      );

      // Should still decrypt successfully — fingerprint must not depend on userAgent
      const result = await secureStorage.getItem("pat");
      expect(result).toBe("ghp_stable_token");
    });

    it("does NOT fall back to plaintext when encryption fails", async () => {
      // Switch to production mode so isWebCryptoAvailable() returns true
      vi.stubEnv("MODE", "production");

      // Mock crypto.subtle.encrypt to throw
      vi.spyOn(crypto.subtle, "encrypt").mockRejectedValue(
        new Error("Simulated encryption failure"),
      );

      // setItem should reject — NOT silently store plaintext
      await expect(
        secureStorage.setItem("pat", "ghp_secret_token"),
      ).rejects.toThrow();

      // Critical invariant: plaintext token must NOT be in localStorage
      const stored = localStorage.getItem("secure_pat");
      expect(stored).toBeNull();
    });
  });

  describe("getItem", () => {
    it("returns null for missing keys", async () => {
      const result = await secureStorage.getItem("nonexistent");
      expect(result).toBeNull();
    });

    it("returns stored value", async () => {
      await secureStorage.setItem("pat", "ghp_test456");
      const result = await secureStorage.getItem("pat");
      expect(result).toBe("ghp_test456");
    });

    it("returns null and clears storage when decryption fails (BUG-022)", async () => {
      // Switch to production mode so real encryption is used
      vi.stubEnv("MODE", "production");

      // Store a value (encrypted)
      await secureStorage.setItem("pat", "ghp_real_token");

      // Corrupt the stored value to simulate decryption failure
      localStorage.setItem("secure_pat", "corrupted_not_base64_ciphertext");

      // getItem should return null, NOT the corrupted ciphertext
      const result = await secureStorage.getItem("pat");
      expect(result).toBeNull();

      // The corrupted key should be removed from localStorage
      expect(localStorage.getItem("secure_pat")).toBeNull();
    });
  });

  describe("removeItem", () => {
    it("removes item from localStorage", async () => {
      await secureStorage.setItem("pat", "ghp_test789");
      secureStorage.removeItem("pat");
      const result = await secureStorage.getItem("pat");
      expect(result).toBeNull();
    });
  });

  describe("hasItem", () => {
    it("returns false for missing keys", () => {
      expect(secureStorage.hasItem("missing")).toBe(false);
    });

    it("returns true for existing keys", async () => {
      await secureStorage.setItem("pat", "ghp_test");
      expect(secureStorage.hasItem("pat")).toBe(true);
    });
  });
});
