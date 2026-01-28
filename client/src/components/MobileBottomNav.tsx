import { Link, useLocation } from "wouter";
import { Home, Star, Users, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
    const [location] = useLocation();

    const items = [
        {
            label: "Início",
            icon: Home,
            href: "/dashboard",
            active: (loc: string) => loc === "/dashboard"
        },
        {
            label: "Com estrela",
            icon: Star,
            href: "/dashboard/storage/favorites", // Virtual route or filtered view
            query: "view=favorites",
            active: (loc: string) => window.location.search.includes("view=favorites")
        },
        {
            label: "Compartilhados",
            icon: Users,
            href: "/dashboard/storage/shared",
            query: "view=shared-with-you",
            active: (loc: string) => window.location.search.includes("view=shared-with-you")
        },
        {
            label: "Arquivos",
            icon: FolderOpen,
            href: "/dashboard/storage",
            active: (loc: string) => loc.startsWith("/dashboard/storage") && !window.location.search.includes("view=")
        },
    ];

    // Helper to handle navigation with query params
    const getHref = (item: typeof items[0]) => {
        if (item.href.includes("favorites")) return `/dashboard/storage/1?view=favorites`; // Default logic? No, let's try to be smarter.
        // If we are in a bucket, preserve bucket ID for 'Files' tab?
        // Actually, the user's specific "External User" flow usually lands them on a bucket.

        // For now, hardcode generic paths that redirect or work
        if (item.query) return `/dashboard/storage?${item.query}`;
        return item.href;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
            {items.map((item) => {
                const isActive = item.active(location);

                // Handle click for query params since wouter Link might not handle complex query updates well automatically, 
                // but href should work fine if full path.
                // Special case: "Com estrela" and "Compartilhados" usually filter the CURRENT bucket list if inside one.
                // But if global, it goes to a global list.

                // We will stick to simple links for now.
                const href = item.query ? `/dashboard/storage?${item.query}` : item.href;

                return (
                    <Link key={item.label} href={href}>
                        <div className={cn("flex flex-col items-center justify-center gap-1 w-16 h-full cursor-pointer transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
                            <div className={cn("p-1 rounded-full transition-colors", isActive && "bg-primary/10")}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
