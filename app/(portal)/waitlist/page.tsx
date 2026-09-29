import type { Metadata } from "next";

import { WaitlistView } from "./view";

export const metadata: Metadata = {
  title: "Waiting List",
  description: "Prioritise the waiting list and review returning-student requests.",
};

export default function WaitlistPage() {
  return <WaitlistView />;
}
