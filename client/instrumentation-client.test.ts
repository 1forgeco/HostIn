import { beforeEach, describe, expect, it, vi } from "vitest";

describe("client theme bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.removeAttribute("style");
  });

  it("restores a custom client colour before the app hydrates", async () => {
    window.localStorage.setItem("hostin-color-theme", "custom");
    window.localStorage.setItem("hostin-custom-color", "#123456");

    await import("./instrumentation-client");

    expect(document.documentElement.dataset.theme).toBe("custom");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#123456");
    expect(document.documentElement.style.getPropertyValue("--accent-soft")).toMatch(/^#[0-9a-f]{6}$/);
  });
});
