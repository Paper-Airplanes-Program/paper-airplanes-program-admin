import { ok, read } from "@/lib/db";
import type { Pair } from "@/lib/types";

export async function GET() {
  return ok(await read<Pair[]>("pairs"));
}
