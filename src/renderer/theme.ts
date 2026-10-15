import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const storageKey = "tilt-theme";
const deviceTheme = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();
const asTheme = (value: string | null): Theme | null =>
  value === "light" || value === "dark" ? value : null;

function readPreference(): Theme | null {
  try {
    return asTheme(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

let preference = readPreference();
let currentTheme: Theme;

function applyTheme() {
  currentTheme = preference ?? (deviceTheme.matches ? "dark" : "light");
  document.documentElement.dataset.theme = currentTheme;
  document.body.dataset.theme = currentTheme;
  listeners.forEach((listener) => listener());
}

// Apply before React mounts; the same palette reaches body-level popovers.
applyTheme();
deviceTheme.addEventListener("change", () => {
  if (preference === null) applyTheme();
});
window.addEventListener("storage", (event) => {
  if (event.key !== storageKey && event.key !== null) return;
  preference = readPreference();
  applyTheme();
});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useTheme() {
  return useSyncExternalStore(subscribe, () => currentTheme);
}

export function toggleTheme() {
  preference = currentTheme === "light" ? "dark" : "light";
  try {
    localStorage.setItem(storageKey, preference);
  } catch {
    // The switch still works for this visit when storage is unavailable.
  }
  applyTheme();
}
