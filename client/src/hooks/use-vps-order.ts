import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { buildUrl } from '@shared/routes';
import type { VpsConfigData } from '@/components/VpsConfigurator';

interface CreateVpsOrderResponse {
    success: boolean;
    order: {
        id: number;
        orderNumber: string;
        status: string;
        totalAmount: number;
    };
    message: string;
}

export function useCreateVpsOrder(accountId: number) {
    return useMutation({
        mutationFn: async (config: VpsConfigData): Promise<CreateVpsOrderResponse> => {
            const url = buildUrl('/api/accounts/:accountId/orders/vps', { accountId });
            const response = await apiRequest('POST', url, {
                vpsConfig: {
                    os: config.os,
                    osVersion: config.os.split('-')[1] || '',
                    location: config.location,
                    locationCode: config.location,
                    cpuCores: config.cpuCores,
                    ramGB: config.ramGB,
                    storageGB: config.storageGB,
                    storageType: 'ssd',
                    bandwidth: config.bandwidth.toString(),
                    hasPublicIP: config.hasPublicIP,
                    publicIPCount: config.publicIPCount,
                    hasBackup: config.hasBackup,
                    backupFrequency: config.backupFrequency || null,
                    internalNetworks: config.internalNetworks,
                    basePriceCents: config.estimatedPrice,
                },
                notes: config.notes,
            });
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'orders'] });
        },
    });
}
