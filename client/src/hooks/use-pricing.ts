import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PricingConfig } from '@shared/schema';

// Fetch pricing configs (public endpoint)
export function usePricing(category?: string) {
    return useQuery<PricingConfig[]>({
        queryKey: ['pricing', category || 'all'],
        queryFn: async () => {
            const url = category
                ? `/api/pricing?category=${category}`
                : '/api/pricing';
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch pricing');
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    });
}

// Get pricing value by key (helper hook)
export function usePricingValue(category: string, resourceKey: string, fallback: number = 0) {
    const { data: pricing } = usePricing(category);
    const config = pricing?.find(p => p.resourceKey === resourceKey);
    return config?.priceCents ?? fallback;
}

// Build pricing map from category
export function usePricingMap(category: string) {
    const { data: pricing, isLoading } = usePricing(category);

    const priceMap = pricing?.reduce((acc, config) => {
        acc[config.resourceKey] = config.priceCents;
        return acc;
    }, {} as Record<string, number>) ?? {};

    return { priceMap, isLoading };
}

// Admin hooks
export function useAdminPricing(category?: string) {
    return useQuery<PricingConfig[]>({
        queryKey: ['admin-pricing', category || 'all'],
        queryFn: async () => {
            const url = category
                ? `/api/admin/pricing?category=${category}`
                : '/api/admin/pricing';
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch pricing');
            return response.json();
        },
    });
}

export function useUpdatePricing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { priceCents?: number; resourceLabel?: string; description?: string; changeReason?: string } }) => {
            const response = await fetch(`/api/admin/pricing/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to update pricing');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
        },
    });
}

export function useCreatePricing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { category: string; resourceKey: string; resourceLabel: string; priceCents: number; unit: string; description?: string }) => {
            const response = await fetch('/api/admin/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to create pricing');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
        },
    });
}

export function useDeletePricing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`/api/admin/pricing/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to delete pricing');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
        },
    });
}

export function usePricingHistory(configId?: number) {
    return useQuery({
        queryKey: ['pricing-history', configId],
        queryFn: async () => {
            const url = configId
                ? `/api/admin/pricing/history?configId=${configId}`
                : '/api/admin/pricing/history';
            const response = await fetch(url, { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch pricing history');
            return response.json();
        },
    });
}

export function useSeedPricing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/admin/pricing/seed', {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to seed pricing');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
        },
    });
}
