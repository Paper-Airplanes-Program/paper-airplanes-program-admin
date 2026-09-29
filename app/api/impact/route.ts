import { ok, read } from "@/lib/db";
import type { ProgramImpact, TutorImpact } from "@/lib/types";

export async function GET() {
  const impact = await read<{ tutor: TutorImpact; program: ProgramImpact }>("impact");
  return ok(impact.program);
}
