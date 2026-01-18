import { Link, useLocation } from "wouter";
import { LayoutDashboard, Database, CreditCard, Users, Settings, Shield, Key } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./ui-custom";

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // For demo purposes, assume email containing "admin" is super admin
  const isSuperAdmin = user?.email?.includes("admin");

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Storage", href: "/dashboard/storage", icon: Database },
    { name: "Team", href: "/dashboard/team", icon: Users },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  if (isSuperAdmin) {
    navItems.push({ name: "Admin Portal", href: "/admin", icon: Shield });
  }

  return (
    <div className="h-screen w-72 bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20">
      <div className="p-8 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-display font-bold text-xl tracking-tight">CloudStorage</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4 mt-4">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-accent/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt="Profile" className="h-10 w-10 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{user?.firstName || "User"}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <a href="/api/logout">
          <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20" size="sm">
            Log out
          </Button>
        </a>
      </div>
    </div>
  );
}
