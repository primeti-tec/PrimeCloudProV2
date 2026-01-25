import { useQuery } from "@tanstack/react-query";

export interface AdminBucket {
    id: number;
    name: string;
    region: string | null;
    sizeBytes: number;
    objectCount: number | null;
    storageLimitGB: number | null;
    createdAt: string | null;
    accountId: number | null;
    accountName: string;
    accountStatus: string | null;
    estimatedCostCents: number;
}

export function useAdminBuckets() {
    return useQuery<AdminBucket[]>({
        queryKey: ["/api/admin/buckets"],
        queryFn: async () => {
            const res = await fetch("/api/admin/buckets", { credentials: "include" });
            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error("Acesso negado: Apenas Super Admins podem visualizar todos os buckets.");
                }
                throw new Error("Falha ao carregar buckets");
            }
            return res.json();
        },
    });
}
