import type { Metadata } from "next";

import { ImpactView } from "./view";

export const metadata: Metadata = {
  title: "Programme Impact",
  description:
    "Donor-ready impact dashboard: learners reached, lesson hours, country spread, outcomes and learner testimonials.",
};

export default function ImpactPage() {
  return <ImpactView />;
}
