import { useState, ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { Button } from "./Button";
import { Menu, LucideIcon } from "lucide-react";

interface SidebarItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
}

export function DashboardLayout({ children, sidebarItems }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex flex-col lg:flex-row">
        <Sidebar 
          items={sidebarItems} 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-8 lg:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                Menu
              </Button>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
