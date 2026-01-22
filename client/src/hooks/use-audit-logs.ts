import { useQuery } from "@tanstack/react-query";

export interface AuditLog {
  id: number;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceType: string;
  resourceName: string;
  details?: Record<string, unknown>;
  severity: "info" | "warning" | "error" | "critical";
  context: "api" | "panel" | "system" | "cron" | null;
  ipAddress: string;
  userAgent: string | null;
  timestamp: string;
}

export interface AuditLogFilters {
  action?: string;
  severity?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(accountId: number | undefined, filters?: AuditLogFilters) {
  return useQuery<AuditLog[]>({
    queryKey: ['/api/accounts', accountId, 'audit-logs', filters],
    queryFn: async () => {
      if (!accountId) return [];
      const params = new URLSearchParams();
      if (filters?.action) params.set("action", filters.action);
      if (filters?.severity) params.set("severity", filters.severity);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.startDate) params.set("startDate", filters.startDate);
      if (filters?.endDate) params.set("endDate", filters.endDate);

      const queryString = params.toString();
      const url = `/api/accounts/${accountId}/audit-logs${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      return res.json();
    },
    enabled: !!accountId,
  });
}
