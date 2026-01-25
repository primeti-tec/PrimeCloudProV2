import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invoice, Account } from "@shared/schema";

export interface InvoiceWithAccount extends Invoice {
    account?: Account;
}

export function useAdminInvoices() {
    return useQuery<InvoiceWithAccount[]>({
        queryKey: ["/api/admin/invoices"],
        queryFn: async () => {
            const res = await fetch("/api/admin/invoices", { credentials: "include" });
            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error("Acesso negado: Apenas Super Admins podem visualizar faturas.");
                }
                throw new Error("Falha ao carregar faturas");
            }
            return res.json();
        },
    });
}

export function useGenerateMonthlyInvoices() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/invoices/generate-monthly", {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Falha ao gerar faturas");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
        },
    });
}

export function useGenerateAccountInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (accountId: number) => {
            const res = await fetch(`/api/admin/invoices/generate/${accountId}`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Falha ao gerar fatura");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
        },
    });
}

export function useMarkInvoicePaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, paymentMethod }: { id: number; paymentMethod?: string }) => {
            const res = await fetch(`/api/admin/invoices/${id}/paid`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Falha ao confirmar pagamento");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
        },
    });
}

export function useUpdateInvoiceStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const res = await fetch(`/api/admin/invoices/${id}/status`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Falha ao atualizar status");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
        },
    });
}
