import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BackupOrderData {
    type: 'backup-cloud' | 'backup-vps';
    storageGB?: number;
    vmSizeGB?: number;
    frequency: string;
    retentionDays: number;
    encrypted?: boolean;
    includeDatabase?: boolean;
    notes?: string;
    estimatedPrice: number;
}

export function useCreateBackupOrder(accountId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: BackupOrderData) => {
            const response = await fetch(`/api/accounts/${accountId}/orders/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create backup order');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders', accountId] });
        },
    });
}
