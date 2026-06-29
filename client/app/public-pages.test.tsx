import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "./page";
import PlansPage from "./plans/page";
import LoginPage from "./login/page";
import NotFound from "./not-found";

describe("public product journey", () => {
  it("keeps plans on a separate route and exposes the demo entry point", () => {
    render(<LandingPage />);

    expect(
      within(screen.getByRole("navigation", { name: "Public navigation" })).getByRole("link", { name: "Plans" })
    ).toHaveAttribute("href", "/plans");
    expect(screen.getByRole("link", { name: "Try live demo" })).toHaveAttribute("href", "/login#demo-accounts");
    expect(screen.queryByRole("heading", { name: "Custom pricing" })).not.toBeInTheDocument();
    expect(document.querySelector(".scrollProgress")).toBeInTheDocument();
  });

  it("adds the interactive product story without removing the existing journey", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "One day. One property. One connected view." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Same property. A very different workday." })).toBeVisible();
    expect(screen.getByRole("heading", { name: "The useful part of the dashboard, right in your pocket." })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "View room 101" }));
    expect(screen.getByText("Room 101", { selector: ".roomDetail b" })).toBeVisible();

    const livePreview = document.querySelector(".livePreview");
    expect(livePreview).not.toBeNull();
    fireEvent.click(within(livePreview as HTMLElement).getByRole("button", { name: "Warden" }));
    expect(within(livePreview as HTMLElement).getByRole("heading", { name: "Today’s work, prioritized." })).toBeVisible();
  });

  it("renders the standalone plans page with paths back to demo and consultation", () => {
    render(<PlansPage />);

    expect(screen.getByRole("heading", { name: "A plan shaped around your property." })).toBeVisible();
    expect(screen.getAllByRole("heading", { name: "Custom pricing" })).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Try every role" })).toHaveAttribute("href", "/login#demo-accounts");
  });

  it("offers useful recovery paths from the branded 1Forge not-found page", () => {
    render(<NotFound />);

    expect(screen.getByRole("heading", { name: "Oops. This room doesn't exist." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to Hostin" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "View plans" })).toHaveAttribute("href", "/plans");
    expect(screen.getByRole("navigation", { name: "Recovery navigation" })).toBeVisible();
  });

  it("shows every seeded workspace role and prefills its exact credentials", () => {
    render(<LoginPage />);

    for (const role of ["Owner", "Warden", "Guard", "Staff", "Tenant", "Parent"]) {
      expect(screen.getByRole("button", { name: `Use ${role} demo account` })).toBeVisible();
    }

    fireEvent.click(screen.getByRole("button", { name: "Use Owner demo account" }));
    expect(screen.getByLabelText("Email address")).toHaveValue("owner@city-complex.hostin.local");
    expect(screen.getByLabelText("Password")).toHaveValue("city-complex@123");
    expect(screen.getByRole("status")).toHaveTextContent("Owner demo selected");
    expect(screen.queryByLabelText("Dashboard colour theme")).not.toBeInTheDocument();
    expect(screen.getByText("Theme managed by 1Forge")).toBeVisible();
  });
});
