import { NavItem, staticNavItems } from "utils/navigation";

// Navigation is static: GitHub Pages has no API routes to fetch it from.
export function useNavigation(): { navItems: NavItem[] } {
  return { navItems: staticNavItems };
}
