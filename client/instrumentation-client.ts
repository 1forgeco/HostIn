function parseHex(value: string) {
  return [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
}

export {};

try {
  const theme = window.localStorage.getItem("hostin-color-theme") || "hostin-coral";
  document.documentElement.dataset.theme = theme;

  if (theme === "custom") {
    const hex = window.localStorage.getItem("hostin-custom-color") || "#22a06b";
    const mix = (target: string, weight: number) => {
      const source = parseHex(hex);
      const destination = parseHex(target);
      return `#${source
        .map((value, index) =>
          Math.round(value + (destination[index] - value) * weight)
            .toString(16)
            .padStart(2, "0")
        )
        .join("")}`;
    };
    const rgb = parseHex(hex).join(", ");
    const variables = {
      "--accent": hex,
      "--accent-strong": mix("#000000", 0.2),
      "--accent-soft": mix("#ffffff", 0.9),
      "--accent-soft-border": mix("#ffffff", 0.68),
      "--accent-gradient-start": mix("#ffffff", 0.18),
      "--accent-gradient-end": mix("#000000", 0.16),
      "--accent-shadow": `rgba(${rgb}, .22)`,
      "--accent-focus": `rgba(${rgb}, .16)`,
      "--nav-active-start": mix("#ffffff", 0.92),
      "--nav-active-end": mix("#ffffff", 0.96),
    };

    Object.entries(variables).forEach(([name, value]) =>
      document.documentElement.style.setProperty(name, value)
    );
  }
} catch {
  document.documentElement.dataset.theme = "hostin-coral";
}
