import { beforeEach, describe, expect, it, vi } from "vitest";

describe("client theme bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.documentElement.removeAttribute("style");
  });

  it("restores the default product theme before the app hydrates", async () => {
    window.localStorage.setItem("hostin-color-theme", "custom");
    window.localStorage.setItem("hostin-custom-color", "#123456");

    await import("./instrumentation-client");

    expect(document.documentElement.dataset.theme).toBe("hostin-green");
    expect(window.localStorage.getItem("hostin-color-theme")).toBeNull();
    expect(window.localStorage.getItem("hostin-custom-color")).toBeNull();
  });
});
