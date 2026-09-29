import { fail, ok, update } from "@/lib/db";
import type { Pair } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = (await request.json()) as { status: Pair["status"] };

  let found = false;
  const rows = await update<Pair[]>("pairs", (current) =>
    current.map((pair) => {
      if (pair.pairId !== id) return pair;
      found = true;
      return { ...pair, status };
    }),
  );
  if (!found) return fail("No such pair", 404);
  return ok(rows.find((pair) => pair.pairId === id));
}
