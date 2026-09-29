"use client";

import { useEffect, useState } from "react";

function readTimezone(fallback: string): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

export function useDeviceTimezone(fallback = "UTC"): string {
  const [timezone, setTimezone] = useState(fallback);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser timezone can only be read after mount
    setTimezone(readTimezone(fallback));
  }, [fallback]);

  return timezone;
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useStoredValue(key: string, event: string): string | null | undefined {
  const [value, setValue] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const update = () => setValue(readStored(key));
    update();

    window.addEventListener(event, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(event, update);
      window.removeEventListener("storage", update);
    };
  }, [key, event]);

  return value;
}

export function writeStored(key: string, value: string | null, event: string) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {}

  window.dispatchEvent(new Event(event));
}
