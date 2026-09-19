"use client";

import { useMemo } from "react";

import { send, useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Application } from "@/lib/applications";
import type { User } from "@/lib/types";

type ApplicationRow = { application: Application; user: User };

export type NotificationKind = "homework" | "grade" | "lesson" | "incident" | "person";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  whenUtc: string | null;
  read: boolean;
};

export async function markAllRead(ids: string[]) {
  if (ids.length) await send("/api/notifications/read", "POST", { ids });
}

export function useNotifications(): Notification[] {
  const { t } = useI18n();
  const { data: applications } = useApi<ApplicationRow[]>("/api/applications");
  const { data: read } = useApi<string[]>("/api/notifications/read");

  return useMemo(() => {
    const list: Omit<Notification, "read">[] = [];

    for (const row of applications ?? []) {
      if (row.application.status !== "pending") continue;
      list.push({
        id: `application-${row.user.id}`,
        kind: "person",
        title: t("notif.application"),
        body: `${row.user.name} · ${t(`role.${row.user.role}`)}`,
        href: "/accounts",
        whenUtc: row.application.submittedUtc,
      });
    }

    const seen = new Set(read ?? []);
    return list
      .map((item) => ({ ...item, read: seen.has(item.id) }))
      .sort((a, b) => (b.whenUtc ?? "").localeCompare(a.whenUtc ?? ""));
  }, [applications, read, t]);
}
