import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { api, buildUrl } from '@shared/routes';
import type { Order, OrderWithDetails } from '@shared/schema';

export function useOrders(accountId: number) {
  return useQuery<OrderWithDetails[]>({
    queryKey: ['/api/accounts', accountId, 'orders'],
    queryFn: async () => {
      const url = buildUrl(api.orders.list.path, { accountId });
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: !!accountId,
  });
}

export function useCreateOrder(accountId: number) {
  return useMutation({
    mutationFn: async (data: {
      productId: number;
      quantity?: number;
      discount?: number;
      notes?: string;
      paymentMethod?: 'credit_card' | 'pix' | 'boleto' | 'bank_transfer';
    }) => {
      const url = buildUrl(api.orders.create.path, { accountId });
      return apiRequest('POST', url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'orders'] });
    },
  });
}

export function useUpdateOrder(accountId: number) {
  return useMutation({
    mutationFn: async ({ orderId, ...data }: {
      orderId: number;
      status?: 'pending' | 'processing' | 'completed' | 'canceled' | 'refunded';
      paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
      notes?: string;
    }) => {
      const url = buildUrl(api.orders.update.path, { accountId, orderId });
      return apiRequest('PATCH', url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'orders'] });
    },
  });
}

export function useCancelOrder(accountId: number) {
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: number; reason?: string }) => {
      const url = buildUrl(api.orders.cancel.path, { accountId, orderId });
      return apiRequest('POST', url, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'orders'] });
    },
  });
}

export function useAdminOrders() {
  return useQuery<OrderWithDetails[]>({
    queryKey: ['/api/admin/orders'],
    queryFn: async () => {
      const response = await fetch(api.orders.listAll.path, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch all orders');
      return response.json();
    },
  });
}
