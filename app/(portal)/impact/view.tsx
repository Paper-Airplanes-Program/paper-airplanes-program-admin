"use client";

import { Clock, Download, Globe2, GraduationCap, Quote, Users } from "lucide-react";

import { AppShell } from "@/components/portal/app-shell";
import { BarList } from "@/components/portal/charts";
import { Loading, SectionCard, StatCard } from "@/components/portal/kit";
import { Button, Progress, useToast } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ProgramImpact } from "@/lib/types";
import { adminNav } from "@/lib/nav";

export function ImpactView() {
  const { t, tv } = useI18n();
  const toast = useToast();
  const { data: programImpact } = useApi<ProgramImpact>("/api/impact");

  if (!programImpact) {
    return (
      <AppShell nav={adminNav} title={t("pimp.title")} description={t("common.loading")}>
        <Loading rows={4} />
      </AppShell>
    );
  }

  return (
    <AppShell
      nav={adminNav}
      title={t("pimp.title")}
      description={t("pimp.subtitle")}
      actions={
        <Button size="sm" variant="secondary" onClick={() => toast.success(t("pimp.exported"))}>
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("pimp.export")}</span>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("pimp.learners")}
          value={programImpact.activeLearners}
          icon={GraduationCap}
          accent="var(--accent-cool)"
        />
        <StatCard
          label={t("pimp.tutors")}
          value={programImpact.activeTutors}
          icon={Users}
          accent="var(--accent)"
          delay={80}
        />
        <StatCard
          label={t("pimp.countries")}
          value={programImpact.countries}
          icon={Globe2}
          accent="var(--accent-iris)"
          delay={160}
        />
        <StatCard
          label={t("pimp.hours")}
          value={programImpact.lessonHours.toLocaleString("en-US")}
          hint={`$${programImpact.costPerLearner} ${t("pimp.perlearner")}`}
          icon={Clock}
          accent="var(--accent-mint)"
          delay={240}
        />
      </div>

      <SectionCard title={t("pimp.bycountry")}>
        <BarList
          data={programImpact.byCountry.map((country) => ({
            label: tv(country.country),
            value: country.learners,
          }))}
          accent="var(--accent-cool)"
        />
      </SectionCard>

      <SectionCard title={t("pimp.outcomes")} delay={80}>
        <div className="flex flex-col gap-5">
          {programImpact.outcomes.map((outcome) => (
            <div key={outcome.id}>
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate font-semibold text-fg">
                  {tv(outcome.label)}
                </span>
                <span className="shrink-0 text-fg-muted tabular-nums">
                  {outcome.value} / {outcome.of}
                </span>
              </div>
              <Progress
                value={(outcome.value / outcome.of) * 100}
                className="mt-2"
                accent="var(--accent-mint)"
                label={tv(outcome.label)}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("pimp.voices")} delay={140}>
        <div className="grid gap-3 sm:grid-cols-2">
          {programImpact.quotes.map((quote) => (
            <blockquote
              key={quote.id}
              className="ring-gradient relative overflow-hidden rounded-2xl border border-line p-5"
              style={{
                background:
                  "radial-gradient(ellipse 80% 100% at 0% 0%, color-mix(in oklab, var(--accent-iris) 10%, transparent), transparent 70%), var(--tint)",
              }}
            >
              <Quote className="h-4 w-4 text-accent" />
              <p className="mt-2 text-[13.5px] leading-relaxed text-pretty text-fg">
                {tv(quote.text)}
              </p>
              <footer className="mt-3 text-[11.5px] font-bold text-fg-subtle">
                {quote.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
