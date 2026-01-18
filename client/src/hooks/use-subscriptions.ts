import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, productId }: { accountId: number; productId: number }) => {
      const url = buildUrl(api.subscriptions.subscribe.path, { accountId });
      const res = await fetch(url, {
        method: api.subscriptions.subscribe.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      return api.subscriptions.subscribe.responses[201].parse(await res.json());
    },
    onSuccess: (_, { accountId }) => {
      // Invalidate account details to show new subscription
      queryClient.invalidateQueries({ queryKey: [api.accounts.get.path, accountId] });
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
    },
  });
}
