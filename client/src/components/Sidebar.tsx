import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Database, CreditCard, Users, Settings, Shield, Key, HardDrive, ShoppingCart, Save, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "./branding-provider";
import { useCurrentRole } from "@/hooks/use-current-account";
import { useMyAccounts } from "@/hooks/use-accounts";
import { useBuckets } from "@/hooks/use-buckets";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui-custom";
import { queryClient } from "@/lib/queryClient";
import { buildUrl, api } from "@shared/routes";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();
  const branding = useBranding();
  const { isExternalClient, canViewBilling, canViewSettings, canManageMembers } = useCurrentRole();

  // Get buckets for submenu
  const { data: accounts } = useMyAccounts();
  const currentAccount = accounts?.[0];
  const { data: buckets } = useBuckets(currentAccount?.id);

  // Storage submenu expanded state
  const [storageExpanded, setStorageExpanded] = useState(location.startsWith("/dashboard/storage"));

  // Update expansion when location changes to storage section
  useEffect(() => {
    if (location.startsWith("/dashboard/storage")) {
      setStorageExpanded(true);
    }
  }, [location]);

  // For demo purposes, assume email containing "admin" is super admin
  const isSuperAdmin = user?.email?.includes("admin");

  // Check if we're in storage section
  const isInStorageSection = location.startsWith("/dashboard/storage");

  // Define all nav items, some conditionally visible
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: !isExternalClient },
    { name: "Acesso SFTP", href: "/dashboard/sftp", icon: HardDrive, show: !isExternalClient },
    { name: "Backup", href: "/dashboard/backup", icon: Save, show: !isExternalClient },
    { name: "Pedidos", href: "/dashboard/orders", icon: ShoppingCart, show: !isExternalClient },
    { name: "Equipe", href: "/dashboard/team", icon: Users, show: canManageMembers },
    { name: "Faturamento", href: "/dashboard/billing", icon: CreditCard, show: canViewBilling },
    { name: "Chaves de API", href: "/dashboard/api-keys", icon: Key, show: !isExternalClient },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings, show: canViewSettings },
  ].filter(item => item.show);

  if (isSuperAdmin) {
    navItems.push({ name: "Admin Portal", href: "/admin", icon: Shield, show: true });
  }

  const prefetchBucketObjects = (bucketId: number) => {
    if (!currentAccount?.id) return;
    queryClient.prefetchQuery({
      queryKey: ['/api/accounts', currentAccount.id, 'buckets', bucketId, 'objects', ''],
      queryFn: async () => {
        const url = new URL(buildUrl(api.objects.list.path, { accountId: currentAccount.id, bucketId }), window.location.origin);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch objects');
        return res.json();
      },
    });
  };

  return (
    <div className="h-screen w-72 bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20">
      <div className="p-8 border-b border-border/50" style={{ backgroundColor: branding.sidebarColor ? `${branding.sidebarColor}15` : undefined }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* Custom Logo or Default */}
          {branding.logo ? (
            <img src={branding.logo} alt={branding.name} className="h-8 w-auto" />
          ) : (
            <>
              <img src="/logo.png" alt={branding.name} className="h-8 w-auto" onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }} />
              <div className="hidden h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">{branding.name[0]}</span>
              </div>
            </>
          )}
          <span className="font-display font-bold text-xl tracking-tight">{branding.name}</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4 mt-4">
          Menu
        </div>

        {/* Dashboard - only for non-external clients */}
        {!isExternalClient && (
          <Link href="/dashboard">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${location === "/dashboard"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              <LayoutDashboard
                className={`h-5 w-5 transition-colors ${location === "/dashboard" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
              />
              Dashboard
            </div>
          </Link>
        )}

        {/* Storage Section - Simplified as requested */}
        <div>
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isInStorageSection ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}>

            <Link href="/dashboard/storage" className="flex items-center gap-3 flex-1 cursor-pointer">
              <Database className={`h-5 w-5 transition-colors ${isInStorageSection ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
              Armazenamento
            </Link>

            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setStorageExpanded(!storageExpanded);
              }}
              className="p-1 rounded-md hover:bg-background/20 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {storageExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>

          {/* Direct Bucket List */}
          {storageExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-border/50 pl-2">
              {buckets && buckets.slice(0, 5).map(bucket => (
                <Link key={bucket.id} href={`/dashboard/storage/${bucket.id}`}>
                  <div
                    onMouseEnter={() => prefetchBucketObjects(bucket.id)}
                    className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer text-sm ${location === `/dashboard/storage/${bucket.id}`
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    <span className="truncate text-xs font-medium">{bucket.name}</span>
                  </div>
                </Link>
              ))}

              {buckets && buckets.length > 5 && (
                <Link href="/dashboard/storage">
                  <div className="text-xs text-muted-foreground hover:text-primary px-3 py-1 cursor-pointer transition-colors block">
                    +{buckets.length - 5} mais...
                  </div>
                </Link>
              )}

              {(!buckets || buckets.length === 0) && (
                <div className="text-xs text-muted-foreground px-3 py-1 italic">
                  Nenhum bucket
                </div>
              )}
            </div>
          )}
        </div>

        {/* Other nav items */}
        {navItems.filter(item => item.name !== "Dashboard").map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group ${isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
            <img src={user.profileImageUrl} alt="Perfil" className="h-10 w-10 rounded-full border-2 border-white shadow-sm" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || user?.email?.[0] || "U"}
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{user?.firstName || "Usuário"}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <div className="flex gap-2 mb-2">
          <ModeToggle />
          <Button
            variant="outline"
            className="flex-1 justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
            size="sm"
            onClick={logout}
            disabled={isLoggingOut}
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
