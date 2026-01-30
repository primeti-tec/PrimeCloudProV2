import { useQuery } from "@tanstack/react-query";
import { type Customer } from "@shared/schema";

export function useCustomers() {
    return useQuery<Customer[]>({
        queryKey: ["/api/customers"],
        queryFn: async () => {
            const res = await fetch("/api/customers");
            if (!res.ok) throw new Error("Failed to fetch customers");
            return res.json();
        },
    });
}

export function useCustomer(id?: number) {
    return useQuery<Customer>({
        queryKey: ["/api/customers", id],
        enabled: !!id,
        queryFn: async () => {
            const res = await fetch(`/api/customers/${id}`);
            if (!res.ok) throw new Error("Failed to fetch customer");
            return res.json();
        },
    });
}
