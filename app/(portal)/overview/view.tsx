"use client";

import { AlertTriangle, CalendarCheck, ListChecks, Users } from "lucide-react";

import { AppShell } from "@/components/portal/app-shell";
import { TrendChart } from "@/components/portal/charts";
import { Loading, SectionCard, StatCard } from "@/components/portal/kit";
import { useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Analytics, Incident, Pair, WaitlistEntry } from "@/lib/types";
import { adminNav } from "@/lib/nav";

export function OverviewView() {
  const { t } = useI18n();
  const { data } = useApi<{
    pairs: Pair[];
    incidents: Incident[];
    waitlist: WaitlistEntry[];
    analytics: Analytics;
  }>("/api/overview");

  if (!data) {
    return (
      <AppShell nav={adminNav} title={t("nav.overview")} description={t("common.loading")}>
        <Loading rows={4} />
      </AppShell>
    );
  }

  const { pairs, incidents, waitlist } = data;
  const attendanceTrend = data.analytics.attendanceTrend;

  const active = pairs.filter((p) => p.status === "active").length;
  const avg = Math.round(
    pairs.reduce((total, pair) => total + pair.attendanceRate, 0) / pairs.length,
  );
  const open = incidents.filter((i) => i.status !== "resolved").length;

  return (
    <AppShell nav={adminNav} title={t("nav.overview")} description={t("app.name")}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.activepairs")}
          value={active}
          icon={Users}
          accent="var(--accent-cool)"
        />
        <StatCard
          label={t("admin.avgattendance")}
          value={`${avg}%`}
          icon={CalendarCheck}
          accent="var(--accent-mint)"
          delay={80}
        />
        <StatCard
          label={t("admin.openincidents")}
          value={open}
          icon={AlertTriangle}
          accent="var(--accent)"
          delay={160}
        />
        <StatCard
          label={t("admin.waitlistsize")}
          value={waitlist.length}
          icon={ListChecks}
          accent="var(--accent-iris)"
          delay={240}
        />
      </div>

      <SectionCard title={t("admin.trend")}>
        <TrendChart
          data={attendanceTrend.map((week) => ({ label: week.week, value: week.rate }))}
          accent="var(--accent-cool)"
        />
      </SectionCard>
    </AppShell>
  );
}
