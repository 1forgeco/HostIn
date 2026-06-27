import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ColorThemeToggle } from "./theme-system";

describe("ColorThemeToggle", () => {
  it("emits preset and custom theme changes", () => {
    const changeTheme = vi.fn();
    const changeCustom = vi.fn();
    render(<ColorThemeToggle customColor="#22a06b" onCustomColor={changeCustom} onChange={changeTheme} themeKey="hostin-coral" />);
    fireEvent.click(screen.getByRole("button", { name: "Studio" }));
    expect(changeTheme).toHaveBeenCalledWith("forge-violet");
    fireEvent.input(screen.getByLabelText("Custom theme colour"), { target: { value: "#123456" } });
    expect(changeCustom).toHaveBeenCalledWith("#123456");
  });
});
