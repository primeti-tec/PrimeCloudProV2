import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateAccountRequest, type UpdateAccountRequest, type AccountWithRole } from "@shared/schema";
import { useAuth } from "./use-auth";

export function useMyAccounts() {
  const { user } = useAuth();

  return useQuery<AccountWithRole[]>({
    queryKey: [api.accounts.listMy.path],
    enabled: !!user, // Only fetch when user is authenticated
    queryFn: async () => {
      const res = await fetch(api.accounts.listMy.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch my accounts");
      return api.accounts.listMy.responses[200].parse(await res.json());
    },
  });
}

export function useAccount(id: number | undefined) {
  return useQuery({
    queryKey: [api.accounts.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.accounts.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch account");
      return api.accounts.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAccountRequest) => {
      const res = await fetch(api.accounts.create.path, {
        method: api.accounts.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.accounts.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create account");
      }
      return api.accounts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateAccountRequest) => {
      const url = buildUrl(api.accounts.update.path, { id });
      const res = await fetch(url, {
        method: api.accounts.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update account");
      }
      return api.accounts.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [api.accounts.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
    },
  });
}
