"use client";

import { AppShell } from "@/components/portal/app-shell";
import { Loading, SectionCard, StatusPill } from "@/components/portal/kit";
import { Button, useToast } from "@/components/ui";
import { send, useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ReturningRequest, WaitlistEntry } from "@/lib/types";
import { adminNav } from "@/lib/nav";

export function WaitlistView() {
  const { t, tv } = useI18n();
  const toast = useToast();
  const { data, refresh } = useApi<{ waitlist: WaitlistEntry[]; returning: ReturningRequest[] }>(
    "/api/waitlist",
  );

  if (!data) {
    return (
      <AppShell nav={adminNav} title={t("nav.waitlist")} description={t("common.loading")}>
        <Loading rows={4} />
      </AppShell>
    );
  }

  const { waitlist } = data;
  const returningRequests = data.returning;

  return (
    <AppShell
      nav={adminNav}
      title={t("nav.waitlist")}
      description={`${waitlist.length} ${t("admin.waitlistsize")}`}
    >
      <SectionCard title={t("nav.waitlist")}>
        <ul className="flex flex-col gap-3">
          {waitlist.map((entry, index) => (
            <li
              key={entry.id}
              className="row grid gap-3 p-4 transition-colors hover:border-line-strong sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-line bg-tint text-[13px] font-extrabold text-fg-muted tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold text-fg">{entry.name}</p>
                <p className="truncate text-[11.5px] text-fg-subtle">
                  {t("common.level")} {entry.level} · {entry.timezone} · {entry.waitingSince}
                </p>
              </div>
              <StatusPill
                tone={
                  entry.priority === "high"
                    ? "danger"
                    : entry.priority === "normal"
                      ? "info"
                      : "neutral"
                }
              >
                {entry.priority}
              </StatusPill>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={t("admin.returning")} delay={80}>
        <ul className="flex flex-col gap-3">
          {returningRequests.map((request) => (
            <li
              key={request.id}
              className="row grid gap-3 p-4 transition-colors hover:border-line-strong sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold text-fg">{request.name}</p>
                <p className="truncate text-[11.5px] text-fg-subtle">
                  {request.previousLevel} · {request.cohort} · {tv(request.reason)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await send(`/api/returning-requests/${request.id}`, "PATCH", {
                      status: "approved",
                    });
                    refresh();
                    toast.success(t("admin.approved"));
                  }}
                >
                  {t("admin.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await send(`/api/returning-requests/${request.id}`, "PATCH", {
                      status: "rejected",
                    });
                    refresh();
                    toast.info(t("admin.rejected"));
                  }}
                >
                  {t("admin.reject")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
