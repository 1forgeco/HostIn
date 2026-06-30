export {};

try {
  document.documentElement.dataset.theme = "hostin-green";
  window.localStorage.removeItem("hostin-color-theme");
  window.localStorage.removeItem("hostin-custom-color");
} catch {
  document.documentElement.dataset.theme = "hostin-green";
}
