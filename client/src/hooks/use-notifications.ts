import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

export function useNotifications(accountId: number | undefined) {
  return useQuery<Notification[]>({
    queryKey: ["/api/accounts", accountId, "notifications"],
    enabled: !!accountId,
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID required");
      const res = await fetch(`/api/accounts/${accountId}/notifications`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });
}

export function useUnreadCount(accountId: number | undefined) {
  return useQuery<{ count: number }>({
    queryKey: ["/api/accounts", accountId, "notifications", "unread-count"],
    enabled: !!accountId,
    queryFn: async () => {
      if (!accountId) throw new Error("Account ID required");
      const res = await fetch(`/api/accounts/${accountId}/notifications/unread-count`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, notificationId }: { accountId: number; notificationId: number }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/accounts/${accountId}/notifications/${notificationId}/read`
      );
      return res.json();
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "notifications", "unread-count"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId }: { accountId: number }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/accounts/${accountId}/notifications/read-all`
      );
      return res.json();
    },
    onSuccess: (_, { accountId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts", accountId, "notifications", "unread-count"] });
    },
  });
}
