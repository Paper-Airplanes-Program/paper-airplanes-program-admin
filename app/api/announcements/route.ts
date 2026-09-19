import { newId, ok, read, update } from "@/lib/db";
import type { AnnouncementSent, AnnouncementTemplate } from "@/lib/types";
import type { Account } from "@/lib/users";

type Store = { templates: AnnouncementTemplate[]; history: AnnouncementSent[] };

// Who an audience resolves to, so the recipient count is real rather than a guess.
const ROLE_FOR: Record<string, Account["role"]> = { students: "student" };

async function countFor(audience: string) {
  const role = ROLE_FOR[audience];
  if (!role) return 0;
  const accounts = await read<Account[]>("users");
  return accounts.filter((a) => a.role === role && a.status === "active").length;
}

export async function GET() {
  return ok(await read<Store>("announcements"));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    subject: AnnouncementSent["subject"];
    body: AnnouncementSent["body"];
    audience: string;
  };
  const sent: AnnouncementSent = {
    id: newId("ann"),
    subject: body.subject,
    body: body.body,
    audience: body.audience,
    sentUtc: new Date().toISOString(),
    recipients: await countFor(body.audience),
    openRate: 0,
  };
  const store = await update<Store>("announcements", (current) => ({
    ...current,
    history: [sent, ...current.history],
  }));
  return ok(store, 201);
}
