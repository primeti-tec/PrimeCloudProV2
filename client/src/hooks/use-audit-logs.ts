import { useQuery } from "@tanstack/react-query";

export interface AuditLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceName: string;
  ipAddress: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export function useAuditLogs(accountId: number | undefined, actionFilter?: string) {
  return useQuery<AuditLog[]>({
    queryKey: ['/api/accounts', accountId, 'audit-logs', actionFilter],
    queryFn: async () => {
      if (!accountId) return [];
      const url = actionFilter 
        ? `/api/accounts/${accountId}/audit-logs?action=${actionFilter}`
        : `/api/accounts/${accountId}/audit-logs`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
    enabled: !!accountId,
  });
}
