import { useQuery } from "@tanstack/react-query";

interface Invoice {
  id: number;
  invoiceNumber: string;
  createdAt: string;
  dueDate: string;
  totalAmount: number;
  status: string;
  paidAt: string | null;
}

interface UsageSummary {
  storageUsedGB: number;
  bandwidthUsedGB: number;
  apiRequestsCount: number;
  projectedCost: number;
}

export function useInvoices(accountId: number | undefined) {
  return useQuery<Invoice[]>({
    queryKey: ['/api/accounts', accountId, 'invoices'],
    enabled: !!accountId,
  });
}

export function useUsageSummary(accountId: number | undefined) {
  return useQuery<UsageSummary>({
    queryKey: ['/api/accounts', accountId, 'usage'],
    enabled: !!accountId,
  });
}
