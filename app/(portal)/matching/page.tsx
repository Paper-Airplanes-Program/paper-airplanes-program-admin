import type { Metadata } from "next";

import { MatchingView } from "./view";

export const metadata: Metadata = {
  title: "Matching Workspace",
  description:
    "Pair unmatched students with available teachers using level, availability and timezone overlap.",
};

export default function MatchingPage() {
  return <MatchingView />;
}
