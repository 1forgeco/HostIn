import { beforeEach, describe, expect, it } from "vitest";
import { applyCustomColor } from "./theme-system";

describe("admin-applied client theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
  });

  it("applies and persists a client theme without exposing a client-side picker", () => {
    applyCustomColor("#123456");

    expect(document.documentElement).toHaveAttribute("data-theme", "custom");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#123456");
    expect(window.localStorage.getItem("hostin-color-theme")).toBe("custom");
    expect(window.localStorage.getItem("hostin-custom-color")).toBe("#123456");
  });
});
