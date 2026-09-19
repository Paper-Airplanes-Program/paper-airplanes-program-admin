"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export function useDeviceTimezone(fallback = "UTC"): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
}

export function useLocationPath(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.pathname,
    () => null,
  );
}

export function useStoredValue(key: string, event: string): string | null | undefined {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(event, onChange);
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(event, onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => undefined,
  );
}

export function writeStored(key: string, value: string | null, event: string) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(event));
}
