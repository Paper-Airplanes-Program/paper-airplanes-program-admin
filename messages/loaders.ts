import type { Locale } from "@/lib/i18n";

export const LOADERS = {
  en: {
    common: () => import("./en/common.json").then((module) => module.default),
    course: () => import("./en/course.json").then((module) => module.default),
    diagnostic: () => import("./en/diagnostic.json").then((module) => module.default),
  },
  ar: {
    common: () => import("./ar/common.json").then((module) => module.default),
    course: () => import("./ar/course.json").then((module) => module.default),
    diagnostic: () => import("./ar/diagnostic.json").then((module) => module.default),
  },
} satisfies Record<Locale, Record<string, () => Promise<unknown>>>;

export type Namespace = keyof (typeof LOADERS)["en"];
