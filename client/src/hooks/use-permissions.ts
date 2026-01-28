import { useAuth } from "@/hooks/use-auth";
import { useCurrentAccount } from "@/hooks/use-current-account";
import { type AccountRole } from "@shared/schema";

export function usePermissions() {
  const { account } = useCurrentAccount();
  const { isSuperAdmin } = useAuth();

  const role: AccountRole = account?.role || "developer";

  const isExternalClient = role === "external_client";
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner";
  const canManageMembers = isAdmin || isOwner;
  const canViewBilling = !isExternalClient;
  const canViewSettings = !isExternalClient;
  const canAccessAdmin = isSuperAdmin;

  return {
    role,
    isExternalClient,
    isOwner,
    isAdmin,
    canManageMembers,
    canViewBilling,
    canViewSettings,
    canAccessAdmin,
  };
}
