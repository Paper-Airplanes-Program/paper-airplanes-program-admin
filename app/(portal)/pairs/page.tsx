import type { Metadata } from "next";

import { PairsView } from "./view";

export const metadata: Metadata = {
  title: "Student-Teacher Pairs",
  description:
    "Search and monitor every active student-teacher pair, attendance rate and health flag.",
};

export default function PairsPage() {
  return <PairsView />;
}
