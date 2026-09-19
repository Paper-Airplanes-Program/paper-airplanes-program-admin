import { LayoutDashboard, Megaphone, UserCheck } from "lucide-react";

import type { NavItem } from "@/components/portal/app-shell";

export const adminNav: NavItem[] = [
  { href: "/overview", labelKey: "nav.overview", icon: LayoutDashboard },
  { href: "/accounts", labelKey: "nav.accounts", icon: UserCheck },
  { href: "/announcements", labelKey: "nav.comms", icon: Megaphone },
];
