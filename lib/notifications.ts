"use client";

import { useMemo } from "react";

import { send, useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Application } from "@/lib/applications";
import type { Incident, Pair, ReturningRequest, User, WaitlistEntry } from "@/lib/types";

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

export function useNotifications() {
  const { t, tv } = useI18n();
  const { data: overview } = useApi<{
    pairs: Pair[];
    incidents: Incident[];
    waitlist: WaitlistEntry[];
  }>("/api/overview");
  const { data: queue } = useApi<{
    waitlist: WaitlistEntry[];
    returning: ReturningRequest[];
  }>("/api/waitlist");
  const { data: applications } = useApi<ApplicationRow[]>("/api/applications");
  const { data: read, refresh } = useApi<string[]>("/api/notifications/read");

  const items = useMemo(() => {
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

    for (const incident of overview?.incidents ?? []) {
      if (incident.status === "resolved") continue;
      list.push({
        id: `incident-${incident.id}`,
        kind: "incident",
        title: t("notif.incident"),
        body: `${incident.reference} · ${incident.pair}`,
        href: "/overview",
        whenUtc: incident.createdUtc,
      });
    }

    for (const pair of overview?.pairs ?? []) {
      if (pair.status !== "rematching") continue;
      list.push({
        id: `rematch-${pair.pairId}`,
        kind: "person",
        title: t("notif.rematch"),
        body: `${pair.student} · ${t("common.level")} ${pair.studentLevel}`,
        href: "/matching",
        whenUtc: null,
      });
    }

    for (const request of queue?.returning ?? []) {
      if (request.status !== "pending") continue;
      list.push({
        id: `returning-${request.id}`,
        kind: "person",
        title: t("notif.returning"),
        body: `${request.name} · ${tv(request.reason)}`,
        href: "/waitlist",
        whenUtc: null,
      });
    }

    const longest = [...(overview?.waitlist ?? [])].sort((a, b) =>
      a.waitingSince.localeCompare(b.waitingSince),
    )[0];
    if (longest) {
      list.push({
        id: `waiting-${longest.id}`,
        kind: "person",
        title: t("notif.waiting"),
        body: `${longest.name} · ${t("common.level")} ${longest.level}`,
        href: "/waitlist",
        whenUtc: `${longest.waitingSince}T00:00:00Z`,
      });
    }

    const seen = new Set(read ?? []);
    return list
      .map((item) => ({ ...item, read: seen.has(item.id) }))
      .sort((a, b) => (b.whenUtc ?? "").localeCompare(a.whenUtc ?? ""));
  }, [overview, queue, applications, read, t, tv]);

  const markAllRead = async () => {
    const ids = items.filter((item) => !item.read).map((item) => item.id);
    if (!ids.length) return;
    await send("/api/notifications/read", "POST", { ids });
    refresh();
  };

  return { items, markAllRead };
}
