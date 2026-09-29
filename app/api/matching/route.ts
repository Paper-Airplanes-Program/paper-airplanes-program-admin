import { fail, newId, ok, read, update } from "@/lib/db";
import type { Pair, Suggestion, TutorOption, WaitlistEntry } from "@/lib/types";

export async function GET() {
  const [waitlist, tutors, suggestions, pairs] = await Promise.all([
    read<WaitlistEntry[]>("waitlist"),
    read<TutorOption[]>("tutors"),
    read<Suggestion[]>("suggestions"),
    read<Pair[]>("pairs"),
  ]);
  return ok({ waitlist, tutors, suggestions, pairs });
}

export async function POST(request: Request) {
  const { studentId, tutorId } = (await request.json()) as {
    studentId: string;
    tutorId: string;
  };
  const [waitlist, tutors] = await Promise.all([
    read<WaitlistEntry[]>("waitlist"),
    read<TutorOption[]>("tutors"),
  ]);
  const student = waitlist.find((entry) => entry.id === studentId);
  const tutor = tutors.find((entry) => entry.id === tutorId);
  if (!student || !tutor) return fail("Unknown student or teacher", 404);

  const pair: Pair = {
    pairId: newId("pair"),
    student: student.name,
    studentLevel: student.level,
    studentTz: student.timezone,
    tutor: tutor.name,
    tutorTz: tutor.timezone,
    status: "active",
    attendanceRate: 0,
    health: "good",
    ungraded: 0,
  };

  await update<Pair[]>("pairs", (current) => [...current, pair]);
  await update<WaitlistEntry[]>("waitlist", (current) =>
    current.filter((entry) => entry.id !== studentId),
  );
  await update<TutorOption[]>("tutors", (current) =>
    current.map((entry) =>
      entry.id === tutorId ? { ...entry, load: entry.load + 1 } : entry,
    ),
  );
  return ok(pair, 201);
}
