"use client";

import {
  Ban,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useState } from "react";

import { UnitAnswers, hasAnswers, unitTitle, type TrainingUnit } from "@/components/portal/answers";
import { AppShell } from "@/components/portal/app-shell";
import {
  EmptyState,
  Loading,
  Row,
  SectionCard,
  StatusPill,
  humanise,
  statusTone,
} from "@/components/portal/kit";
import { Button, Input, Select, Textarea, cn, useToast } from "@/components/ui";
import { send, useApi } from "@/lib/api";
import type { Application } from "@/lib/applications";
import { useDeviceTimezone } from "@/lib/client";
import { useI18n, useMessages } from "@/lib/i18n";
import { adminNav } from "@/lib/nav";
import { formatDate, timezoneOptions } from "@/lib/time";
import type { User } from "@/lib/types";

type Row = {
  application: Application;
  user: User;
  training: TrainingUnit[];
  completed: number;
};

function unitName(slug: string) {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  active: "success",
  approved: "success",
  pending: "warning",
  new: "info",
  rejected: "danger",
  suspended: "danger",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold tracking-[0.12em] text-fg-faint uppercase">
        {label}
      </p>
      <p className="mt-1 text-[13.5px] leading-relaxed text-fg">{value || "—"}</p>
    </div>
  );
}

function UnitRow({ unit }: { unit: TrainingUnit }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const title = unitTitle(unit.slug);
  const scores = unit.quizzes.map((quiz) => `${quiz.score}/${quiz.total}`);
  const examCount = unit.exams.reduce(
    (count, exam) => count + Object.keys(exam.answers).length,
    0,
  );
  const summary =
    scores.join(" · ") ||
    (examCount
      ? `${examCount} ${t("exam.questions")}`
      : `${unit.blocksDone} ${t("training.tasksdone")}`);

  return (
    <li className="row p-3">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-fg">
            {title ? t(title) : unitName(unit.slug)}
          </p>
          <p className="truncate text-[11.5px] text-fg-subtle">{summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusPill tone={unit.completedAt ? "success" : "warning"}>
            {t(unit.completedAt ? "training.completed" : "training.inprogress")}
          </StatusPill>
          {hasAnswers(unit) && (
            <Button size="sm" variant="secondary" onClick={() => setOpen((value) => !value)}>
              {open ? t("review.hideanswers") : t("review.showanswers")}
            </Button>
          )}
        </div>
      </div>
      {open && <UnitAnswers unit={unit} />}
    </li>
  );
}

function Review({ row, onDone }: { row: Row; onDone: () => void }) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useMessages("course");
  useMessages("diagnostic");

  const quizzes = row.training.flatMap((unit) => unit.quizzes);
  const score = quizzes.reduce((total, quiz) => total + quiz.score, 0);
  const outOf = quizzes.reduce((total, quiz) => total + quiz.total, 0);

  const decide = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !reason.trim()) {
      toast.info(t("review.needreason"));
      return;
    }
    setBusy(true);
    try {
      await send(`/api/applications/${row.user.id}/decision`, "POST", {
        decision,
        reason: reason.trim() || undefined,
      });
      toast.success(t(decision === "approved" ? "review.approved" : "review.rejected"));
      onDone();
    } catch (cause) {
      toast.info((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-5 border-t border-line pt-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label={t("review.training")} value={String(row.completed)} />
        <Field
          label={t("training.overallscore")}
          value={outOf ? `${score}/${outOf}` : "—"}
        />
        <Field label={t("common.timezone")} value={row.user.timezone} />
        <Field
          label={t("review.sentat")}
          value={
            row.application.submittedUtc
              ? formatDate(row.application.submittedUtc, locale)
              : t("review.notsent")
          }
        />
      </div>

      {row.training.length === 0 ? (
        <EmptyState message={t("review.notraining")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {row.training.map((unit) => (
            <UnitRow key={unit.slug} unit={unit} />
          ))}
        </ul>
      )}

      <Textarea
        label={t("review.reason")}
        placeholder={t("review.reasonhint")}
        className="min-h-24"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => decide("approved")}>
          <CheckCircle2 className="h-4 w-4" />
          {t("review.approve")}
        </Button>
        <Button variant="danger" disabled={busy} onClick={() => decide("rejected")}>
          {t("review.reject")}
        </Button>
      </div>
    </div>
  );
}

const CREATE_ERRORS: Record<string, string> = {
  taken: "auth.taken",
  invalid: "auth.invalid",
  mismatch: "auth.mismatch",
};

function NewAdmin({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const deviceTz = useDeviceTimezone("UTC");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const zone = timezone ?? deviceTz;
  const zones = timezoneOptions.includes(zone) ? timezoneOptions : [zone, ...timezoneOptions];
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  return (
    <form
      className="mb-5 flex flex-col gap-4 border-b border-line pb-5"
      onSubmit={async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
          toast.info(t("auth.mismatch"));
          return;
        }
        setBusy(true);
        try {
          await send("/api/accounts", "POST", {
            name,
            email,
            password,
            confirmPassword,
            timezone: zone,
          });
          toast.success(t("review.created"));
          onDone();
        } catch (cause) {
          const message = (cause as Error).message;
          toast.info(CREATE_ERRORS[message] ? t(CREATE_ERRORS[message]) : message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-[12.5px] text-fg-muted">{t("review.newadminhint")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("auth.name")}
          autoComplete="off"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label={t("auth.email")}
          type="email"
          autoComplete="off"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          dir="ltr"
        />
        <Input
          label={t("auth.password")}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint={t("auth.passwordhint")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          dir="ltr"
        />
        <Input
          label={t("auth.confirmpassword")}
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          error={mismatch ? t("auth.mismatch") : undefined}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          dir="ltr"
        />
        <Select
          label={t("common.timezone")}
          value={zone}
          onChange={(event) => setTimezone(event.target.value)}
          options={zones.map((option) => ({ value: option, label: option }))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          <UserPlus className="h-4 w-4" />
          {busy ? t("common.loading") : t("auth.createcta")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onDone}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}

export function AccountsView() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: rows, loading } = useApi<Row[]>("/api/applications");
  const { data: accounts } = useApi<User[]>("/api/accounts");

  const pending = (rows ?? []).filter((row) => row.application.status === "pending");
  const reviewed = (rows ?? []).filter((row) => row.application.status !== "pending");

  const visible = (accounts ?? []).filter((account) =>
    `${account.name} ${account.email} ${account.role}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );

  const setStatus = async (account: User, status: "active" | "suspended") => {
    try {
      await send(`/api/accounts/${account.id}`, "PATCH", { status });
      toast.success(t(status === "suspended" ? "review.banned" : "review.restored"));
    } catch (cause) {
      toast.info((cause as Error).message);
    }
  };

  return (
    <AppShell nav={adminNav} title={t("review.title")} description={t("review.subtitle")}>

      <SectionCard
        title={t("review.pending")}
        description={`${pending.length}`}
        action={<UserCheck className="h-4 w-4 text-fg-faint" />}
        delay={80}
      >
        {loading && <Loading rows={2} />}
        {!loading && pending.length === 0 && <EmptyState message={t("review.nopending")} />}

        <ul className="flex flex-col gap-3">
          {pending.map((row) => (
            <li key={row.user.id} className="row p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">{row.user.name}</p>
                  <p className="truncate text-[11.5px] text-fg-subtle">
                    {row.user.email} · {t(`role.${row.user.role}`)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusPill tone={STATUS_TONE[row.application.status] ?? "neutral"}>
                    {humanise(row.application.status)}
                  </StatusPill>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setOpenId(openId === row.user.id ? null : row.user.id)}
                  >
                    {openId === row.user.id ? t("review.close") : t("review.open")}
                  </Button>
                </div>
              </div>
              {openId === row.user.id && (
                <Review row={row} onDone={() => setOpenId(null)} />
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title={t("review.decided")} delay={140}>
        {reviewed.length === 0 ? (
          <EmptyState message={t("common.empty")} />
        ) : (
          <ul className="flex flex-col gap-3">
            {reviewed.map((row) => (
              <Row key={row.user.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">{row.user.name}</p>
                  <p className="truncate text-[11.5px] text-fg-subtle">
                    {row.application.decidedUtc
                      ? formatDate(row.application.decidedUtc, locale)
                      : t("review.notsent")}
                    {row.application.reason ? ` · ${row.application.reason}` : ""}
                  </p>
                </div>
                <StatusPill tone={STATUS_TONE[row.application.status] ?? "neutral"}>
                  {humanise(row.application.status)}
                </StatusPill>
              </Row>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title={t("review.accounts")}
        description={`${visible.length}`}
        action={
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-fg-faint" />
            <Button
              size="sm"
              variant={creating ? "secondary" : "primary"}
              onClick={() => setCreating((open) => !open)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {creating ? t("review.close") : t("review.newadmin")}
            </Button>
          </div>
        }
        delay={200}
      >
        {creating && <NewAdmin onDone={() => setCreating(false)} />}
        <Input
          placeholder={t("common.search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          wrapperClassName="mb-4 sm:max-w-xs"
        />
        <ul className="flex flex-col gap-3">
          {visible.map((account) => {
            const banned = account.status === "suspended";
            return (
              <li
                key={account.id}
                className={cn("row grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center")}
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold text-fg">{account.name}</p>
                  <p className="truncate text-[11.5px] text-fg-subtle">
                    {account.email} · {t(`role.${account.role}`)}
                  </p>
                </div>
                <StatusPill tone={STATUS_TONE[account.status] ?? "neutral"}>
                  {humanise(account.status)}
                </StatusPill>
                {account.role === "admin" ? (
                  <span className="text-[12px] text-fg-subtle">{t("review.selfadmin")}</span>
                ) : (
                  <Button
                    size="sm"
                    variant={banned ? "secondary" : "danger"}
                    onClick={() => setStatus(account, banned ? "active" : "suspended")}
                  >
                    {banned ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Ban className="h-3.5 w-3.5" />
                    )}
                    {banned ? t("review.restore") : t("review.ban")}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
