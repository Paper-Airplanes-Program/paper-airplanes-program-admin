import { newId, ok, read, update } from "@/lib/db";
import type { AnnouncementSent, AnnouncementTemplate } from "@/lib/types";

type Store = { templates: AnnouncementTemplate[]; history: AnnouncementSent[] };

export async function GET() {
  return ok(await read<Store>("announcements"));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    subject: AnnouncementSent["subject"];
    audience: string;
    recipients: number;
  };
  const sent: AnnouncementSent = {
    id: newId("ann"),
    subject: body.subject,
    audience: body.audience,
    sentUtc: new Date().toISOString(),
    recipients: body.recipients,
    openRate: 0,
  };
  const store = await update<Store>("announcements", (current) => ({
    ...current,
    history: [sent, ...current.history],
  }));
  return ok(store, 201);
}
