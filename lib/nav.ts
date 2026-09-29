import {
  BarChart3,
  UserCheck,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Shuffle,
  Users,
} from "lucide-react";

import type { NavItem } from "@/components/portal/app-shell";

export const adminNav: NavItem[] = [
  { href: "/overview", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/accounts", labelKey: "nav.accounts", icon: UserCheck },
  { href: "/pairs", labelKey: "nav.pairs", icon: Users },
  { href: "/matching", labelKey: "nav.matching", icon: Shuffle },
  { href: "/waitlist", labelKey: "nav.waitlist", icon: ListChecks },
  { href: "/impact", labelKey: "nav.impact", icon: BarChart3 },
  { href: "/announcements", labelKey: "nav.comms", icon: Megaphone },
];
