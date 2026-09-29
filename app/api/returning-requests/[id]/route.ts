import { fail, ok, update } from "@/lib/db";
import type { ReturningRequest } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status } = (await request.json()) as { status: string };

  let found = false;
  const rows = await update<ReturningRequest[]>("returning-requests", (current) =>
    current.map((entry) => {
      if (entry.id !== id) return entry;
      found = true;
      return { ...entry, status };
    }),
  );
  if (!found) return fail("No such request", 404);
  return ok(rows.find((entry) => entry.id === id));
}
