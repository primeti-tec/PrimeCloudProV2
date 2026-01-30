
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui-custom";
import { useAuth } from "@/hooks/use-auth";
import { useBranding } from "@/components/branding-provider";
import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
    children: React.ReactNode;
    className?: string;
    showHeader?: boolean;
}

export default function DashboardLayout({ children, className, showHeader = true }: DashboardLayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user } = useAuth();
    const branding = useBranding();
    const { isExternalClient } = usePermissions();

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <Sidebar className="hidden md:flex" />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-72 flex flex-col min-h-screen pb-16 md:pb-0 overflow-x-hidden">
                {showHeader && (
                    <header
                        className="h-14 flex items-center justify-between px-6 text-white shrink-0 sticky top-0 z-10 shadow-sm"
                        style={{ backgroundColor: branding.primaryColor }}
                    >
                        <div className="flex items-center gap-3">
                            {/* Mobile Menu Trigger */}
                            <div className="md:hidden">
                                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-ml-3 text-white hover:bg-white/10">
                                            <Menu className="h-6 w-6" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="p-0 w-72 border-r z-50">
                                        <Sidebar
                                            className="w-full relative h-full"
                                            onClose={() => setIsMobileMenuOpen(false)}
                                        />
                                    </SheetContent>
                                </Sheet>
                            </div>

                            {/* Mobile Header Logo */}

                            <span className="text-lg md:text-xl font-bold text-white tracking-wide truncate max-w-[200px]">
                                {branding.name || "Cliente"}
                            </span>
                        </div>

                        {!isExternalClient && (
                            <div className="hidden md:flex items-center gap-4 ml-auto">
                                {/* Icons removed as requested */}
                            </div>
                        )}
                    </header>
                )}

                {/* Page Content */}
                <div className={cn("flex-1 p-0 md:p-0", className)}>
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Nav (Optional - keeping mostly hidden if Sidebar handles nav, but keeping legacy structure if needed) */}
            {/* In refactor, we are relying on the Hamburger Menu + Sidebar for primary nav, 
          but if you have a MobileBottomNav component, verify if it's still needed. 
          Assuming we might want to keep the bottom nav for quick actions, checking usage later. */}
        </div>
    );
}
