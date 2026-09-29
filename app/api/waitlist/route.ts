import { ok, read } from "@/lib/db";
import type { ReturningRequest, WaitlistEntry } from "@/lib/types";

export async function GET() {
  const [waitlist, returning] = await Promise.all([
    read<WaitlistEntry[]>("waitlist"),
    read<ReturningRequest[]>("returning-requests"),
  ]);
  return ok({ waitlist, returning });
}
