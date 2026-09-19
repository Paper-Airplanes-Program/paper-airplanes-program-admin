"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { PlaneMark } from "@/components/ui";
import { useStoredValue, writeStored } from "@/lib/client";
import { LOADERS, type Namespace } from "@/messages/loaders";

export type Locale = "en" | "ar";

export type L = { en: string; ar: string };

export const LOCALE_KEY = "pa-locale";
export const LOCALE_EVENT = "pa-localechange";

export const localeScript = `(function(){try{var l=localStorage.getItem("${LOCALE_KEY}");if(l==="ar"){document.documentElement.setAttribute("dir","rtl");document.documentElement.setAttribute("lang","ar")}}catch(e){}})()`;

type Messages = { [key: string]: string | Messages };

type Loaded = Partial<Record<Locale, Partial<Record<Namespace, Messages>>>>;

function lookup(messages: Messages, key: string): string | undefined {
  let node: string | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

type I18nValue = {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
  tv: (value: L) => string;
  requestNamespace: (namespace: Namespace) => void;
  hasNamespace: (namespace: Namespace) => boolean;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const stored = useStoredValue(LOCALE_KEY, LOCALE_EVENT);
  const locale: Locale = stored === "ar" ? "ar" : "en";

  const [loaded, setLoaded] = useState<Loaded>({});
  const [wanted, setWanted] = useState<Namespace[]>(["common"]);

  const active = useMemo(() => loaded[locale] ?? {}, [loaded, locale]);

  useEffect(() => {
    let alive = true;
    for (const namespace of wanted) {
      if (active[namespace]) continue;
      void LOADERS[locale][namespace]().then((file) => {
        if (!alive) return;
        setLoaded((current) => ({
          ...current,
          [locale]: { ...current[locale], [namespace]: file as Messages },
        }));
      });
    }
    return () => {
      alive = false;
    };
  }, [locale, wanted, active]);

  const setLocale = useCallback((next: Locale) => {
    writeStored(LOCALE_KEY, next, LOCALE_EVENT);
    const root = document.documentElement;
    root.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    root.setAttribute("lang", next);
  }, []);

  const request = useCallback((namespace: Namespace) => {
    setWanted((current) =>
      current.includes(namespace) ? current : [...current, namespace],
    );
  }, []);

  const value = useMemo<I18nValue>(() => {
    const files = Object.values(active) as Messages[];
    return {
      locale,
      dir: locale === "ar" ? "rtl" : "ltr",
      setLocale,
      toggleLocale: () => setLocale(locale === "en" ? "ar" : "en"),
      t: (key) => {
        const [head, ...rest] = key.split(".");
        const named = active[head as Namespace];
        if (named && rest.length) {
          const found = lookup(named, rest.join("."));
          if (found !== undefined) return found;
        }
        for (const file of files) {
          const found = lookup(file, key);
          if (found !== undefined) return found;
        }
        return key;
      },
      tv: (v) => v[locale],
      requestNamespace: request,
      hasNamespace: (namespace) => !!active[namespace],
    };
  }, [locale, active, setLocale, request]);

  if (!active.common) {
    return (
      <div className="grid min-h-screen place-items-center">
        <PlaneMark className="h-10 w-10 animate-float" />
      </div>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function useMessages(namespace: Namespace | null): boolean {
  const { requestNamespace, hasNamespace } = useI18n();

  useEffect(() => {
    if (namespace) requestNamespace(namespace);
  }, [requestNamespace, namespace]);

  return namespace ? hasNamespace(namespace) : true;
}
