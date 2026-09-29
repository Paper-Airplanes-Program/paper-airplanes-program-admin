import { ok, read } from "@/lib/db";
import type { Analytics, Incident, Pair, WaitlistEntry } from "@/lib/types";

export async function GET() {
  const [pairs, incidents, waitlist, analytics] = await Promise.all([
    read<Pair[]>("pairs"),
    read<Incident[]>("incidents"),
    read<WaitlistEntry[]>("waitlist"),
    read<Analytics>("analytics"),
  ]);
  return ok({ pairs, incidents, waitlist, analytics });
}
