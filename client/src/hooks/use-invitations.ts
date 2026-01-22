import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Invitation } from "@shared/schema";

interface InvitationWithDetails extends Invitation {
  account?: { id: number; name: string } | null;
  inviter?: { firstName: string | null; email: string | null } | null;
}

export function useInvitations(accountId: number | undefined) {
  return useQuery<Invitation[]>({
    queryKey: ['/api/accounts', accountId, 'invitations'],
    enabled: !!accountId,
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID required");
      const res = await fetch(`/api/accounts/${accountId}/invitations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invitations");
      return res.json();
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, email, role, bucketPermissions }: {
      accountId: number;
      email: string;
      role: string;
      bucketPermissions?: Array<{ bucketId: number; permission: string }>;
    }) => {
      const res = await fetch(`/api/accounts/${accountId}/invitations`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, bucketPermissions }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create invitation");
      }
      return res.json();
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'invitations'] });
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, invitationId }: { accountId: number; invitationId: number }) => {
      const res = await fetch(`/api/accounts/${accountId}/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to cancel invitation");
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounts', accountId, 'invitations'] });
    },
  });
}

export function useInvitationByToken(token: string | undefined) {
  return useQuery<InvitationWithDetails>({
    queryKey: ['/api/invitations', token],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      if (!token) throw new Error("Token required");
      const res = await fetch(`/api/invitations/${token}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch invitation");
      }
      return res.json();
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to accept invitation");
      }
      return res.json();
    },
    onSuccess: (_, token) => {
      // Invalidate the invitation query since it's now accepted
      queryClient.invalidateQueries({ queryKey: ['/api/invitations', token] });
    },
  });
}
