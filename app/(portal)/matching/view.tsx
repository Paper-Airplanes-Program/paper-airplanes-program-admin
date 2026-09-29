"use client";

import { AppShell } from "@/components/portal/app-shell";
import { EmptyState, Loading, SectionCard, StatusPill } from "@/components/portal/kit";
import { Button, useToast } from "@/components/ui";
import { send, useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Pair, Suggestion, TutorOption, WaitlistEntry } from "@/lib/types";
import { adminNav } from "@/lib/nav";

export function MatchingView() {
  const { t, tv } = useI18n();
  const toast = useToast();
  const { data, refresh } = useApi<{
    waitlist: WaitlistEntry[];
    tutors: TutorOption[];
    suggestions: Suggestion[];
    pairs: Pair[];
  }>("/api/matching");

  if (!data) {
    return (
      <AppShell nav={adminNav} title={t("nav.matching")} description={t("common.loading")}>
        <Loading rows={4} />
      </AppShell>
    );
  }

  const { waitlist, suggestions, pairs } = data;
  const availableTutors = data.tutors;
  const needsRematch = pairs.filter(
    (pair) => pair.health === "at_risk" || pair.status === "rematching",
  );

  return (
    <AppShell nav={adminNav} title={t("nav.matching")} description={t("admin.suggested")}>
      <SectionCard title={t("admin.suggested")}>
        <ul className="flex flex-col gap-3">
          {suggestions.map((suggestion) => {
            const student = waitlist.find((w) => w.id === suggestion.studentId);
            const tutor = availableTutors.find((x) => x.id === suggestion.tutorId);
            return (
              <li
                key={suggestion.studentId}
                className="row grid gap-3 p-4 transition-colors hover:border-line-strong sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">
                    {student?.name} → {tutor?.name}
                  </p>
                  <p className="truncate text-[11.5px] text-fg-subtle">
                    {tv(suggestion.reasons)}
                  </p>
                </div>
                <StatusPill
                  tone={
                    suggestion.score > 80
                      ? "success"
                      : suggestion.score > 65
                        ? "warning"
                        : "neutral"
                  }
                >
                  {suggestion.score}%
                </StatusPill>
                <Button
                  size="sm"
                  onClick={async () => {
                    await send("/api/matching", "POST", {
                      studentId: suggestion.studentId,
                      tutorId: suggestion.tutorId,
                    });
                    refresh();
                    toast.success(t("admin.matchconfirmed"));
                  }}
                >
                  {t("admin.confirmmatch")}
                </Button>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title={t("admin.rematch")} delay={80}>
        {needsRematch.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {needsRematch.map((pair) => (
              <li
                key={pair.pairId}
                className="row grid gap-3 p-4 transition-colors hover:border-line-strong sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">
                    {pair.student} · {pair.tutor}
                  </p>
                  <p className="text-[11.5px] text-fg-subtle">{pair.attendanceRate}%</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toast.info(t("admin.returned"))}
                >
                  {t("admin.rematch")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </AppShell>
  );
}
