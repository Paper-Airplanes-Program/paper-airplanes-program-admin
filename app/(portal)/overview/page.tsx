import type { Metadata } from "next";

import { OverviewView } from "./view";

export const metadata: Metadata = {
  title: "Overview",
  description:
    "Monitor student-teacher pairs, attendance trends, incidents and the waiting list.",
};

export default function OverviewPage() {
  return <OverviewView />;
}
