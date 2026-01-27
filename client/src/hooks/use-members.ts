import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { type CreateMemberRequest } from "@shared/schema";

export function useMembers(accountId: number | undefined) {
  return useQuery({
    queryKey: [api.members.list.path, accountId],
    enabled: !!accountId,
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID required");
      const url = buildUrl(api.members.list.path, { accountId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch members");
      return api.members.list.responses[200].parse(await res.json());
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, email, role }: { accountId: number; email: string; role: 'admin' | 'developer' | 'owner' }) => {
      const url = buildUrl(api.members.add.path, { accountId });
      const res = await fetch(url, {
        method: api.members.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add member");
      return api.members.add.responses[201].parse(await res.json());
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path, accountId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, memberId }: { accountId: number; memberId: number }) => {
      const url = buildUrl(api.members.remove.path, { accountId, memberId });
      await apiRequest(api.members.remove.method, url);
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path, accountId] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, memberId, role }: { accountId: number; memberId: number; role: string }) => {
      const res = await fetch(`/api/accounts/${accountId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: [api.members.list.path, accountId] });
    },
  });
}
