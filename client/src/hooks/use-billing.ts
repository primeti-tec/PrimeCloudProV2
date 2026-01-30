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
  pricePerStorageGB?: number;
  pricePerTransferGB?: number;
  backupLicenseCostCents?: number;
  imperiusLicenseCount?: number;
  productName?: string;
  contractedStorageGB?: number;
  buckets?: {
    name: string;
    sizeBytes: number;
    storageLimitGB: number;
    isImperiusBackup?: boolean;
  }[];
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

export interface UsageRecord {
  id: number;
  accountId: number;
  storageBytes: number;
  bandwidthIngress: number;
  bandwidthEgress: number;
  requestsCount: number;
  createdAt: string;
}

export function useUsageHistory(accountId: number | undefined) {
  return useQuery<UsageRecord[]>({
    queryKey: ['/api/accounts', accountId, 'usage', 'history'],
    enabled: !!accountId,
  });
}
