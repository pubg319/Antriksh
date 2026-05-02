import { Link, useLocation } from "react-router";
import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarItem[];
}

export function Sidebar({ items }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-border min-h-screen">
      <div className="p-6">
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-[#5B47ED] text-white"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
