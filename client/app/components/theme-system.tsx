"use client";

function mix(hex: string, target: string, weight: number) {
  const parse = (value: string) => [1, 3, 5].map((index) => parseInt(value.slice(index, index + 2), 16));
  const [r, g, b] = parse(hex);
  const [tr, tg, tb] = parse(target);
  return `#${[r, g, b].map((value, index) => Math.round(value + ([tr, tg, tb][index] - value) * weight).toString(16).padStart(2, "0")).join("")}`;
}

function customVariables(hex: string) {
  const rgb = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)).join(", ");
  return {
    "--accent": hex,
    "--accent-strong": mix(hex, "#000000", 0.2),
    "--accent-soft": mix(hex, "#ffffff", 0.9),
    "--accent-soft-border": mix(hex, "#ffffff", 0.68),
    "--accent-gradient-start": mix(hex, "#ffffff", 0.18),
    "--accent-gradient-end": mix(hex, "#000000", 0.16),
    "--accent-shadow": `rgba(${rgb}, 0.22)`,
    "--accent-focus": `rgba(${rgb}, 0.16)`,
    "--nav-active-start": mix(hex, "#ffffff", 0.92),
    "--nav-active-end": mix(hex, "#ffffff", 0.96),
  };
}

function clearCustomVariables() {
  Object.keys(customVariables("#000000")).forEach((name) => document.documentElement.style.removeProperty(name));
}

export function applyCustomColor(hex: string) {
  clearCustomVariables();
  document.documentElement.dataset.theme = "custom";
  Object.entries(customVariables(hex)).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
}

export function applyDefaultTheme() {
  clearCustomVariables();
  document.documentElement.dataset.theme = "hostin-green";
  window.localStorage.removeItem("hostin-color-theme");
  window.localStorage.removeItem("hostin-custom-color");
}
