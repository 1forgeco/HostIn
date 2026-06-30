import { beforeEach, describe, expect, it } from "vitest";
import { applyCustomColor, applyDefaultTheme } from "./theme-system";

describe("admin-applied client theme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
  });

  it("applies a client theme only to the active role app", () => {
    applyCustomColor("#123456");

    expect(document.documentElement).toHaveAttribute("data-theme", "custom");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#123456");
    expect(window.localStorage.getItem("hostin-color-theme")).toBeNull();
  });

  it("restores HostIn branding when leaving a client role app", () => {
    applyCustomColor("#123456");
    applyDefaultTheme();

    expect(document.documentElement).toHaveAttribute("data-theme", "hostin-green");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("");
  });
});
