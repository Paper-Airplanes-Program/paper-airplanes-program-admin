"use client";

import { useState } from "react";

import { AppShell } from "@/components/portal/app-shell";
import {
  EmptyState,
  SectionCard,
  StatusPill,
  humanise,
  statusTone,
} from "@/components/portal/kit";
import { Input } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Pair } from "@/lib/types";
import { adminNav } from "@/lib/nav";

const HEALTH_KEY: Record<string, string> = {
  good: "admin.healthgood",
  watch: "admin.healthwatch",
  at_risk: "admin.healthat_risk",
};

export function PairsView() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const { data } = useApi<Pair[]>("/api/pairs");
  const pairs = data ?? [];

  const rows = pairs.filter((pair) =>
    `${pair.student} ${pair.tutor}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell
      nav={adminNav}
      title={t("nav.pairs")}
      description={`${pairs.length} ${t("nav.pairs")}`}
    >
      <SectionCard
        title={t("nav.pairs")}
        action={
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("common.search")}
            className="h-9 w-36 sm:w-56"
          />
        }
      >
        {rows.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((pair) => (
              <li
                key={pair.pairId}
                className="row grid gap-3 p-4 transition-colors hover:border-line-strong sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">
                    {pair.student} · {pair.tutor}
                  </p>
                  <p className="truncate text-[11.5px] text-fg-subtle">
                    {t("common.level")} {pair.studentLevel} · {pair.studentTz} →{" "}
                    {pair.tutorTz} · {pair.attendanceRate}%
                  </p>
                </div>
                <StatusPill tone={statusTone(pair.status)}>{pair.status}</StatusPill>
                <StatusPill tone={statusTone(pair.health)}>
                  {HEALTH_KEY[pair.health]
                    ? t(HEALTH_KEY[pair.health])
                    : humanise(pair.health)}
                </StatusPill>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </AppShell>
  );
}
