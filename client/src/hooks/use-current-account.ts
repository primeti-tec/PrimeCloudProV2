import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMyAccounts } from "./use-accounts";
import { useState, useEffect } from "react";
import { api } from "@shared/routes";

export function useCurrentAccount() {
  const { data: accounts } = useMyAccounts();
  const [account, setAccount] = useState<any>(null);

  // Get the current account from localStorage or default to first account
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const savedAccountId = localStorage.getItem("currentAccountId");
      const currentAccount = savedAccountId
        ? accounts.find(a => a.id === parseInt(savedAccountId))
        : accounts[0];

      setAccount(currentAccount || accounts[0]);
    }
  }, [accounts]);

  const switchAccount = (accountId: number) => {
    const newAccount = accounts?.find(a => a.id === accountId);
    if (newAccount) {
      setAccount(newAccount);
      localStorage.setItem("currentAccountId", accountId.toString());
    }
  };

  return { account, switchAccount, accounts };
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, branding }: {
      accountId: number;
      branding: {
        brandingName?: string | null;
        brandingLogo?: string | null;
        brandingFavicon?: string | null;
        brandingPrimaryColor?: string | null;
        brandingSidebarColor?: string | null;
      };
    }) => {
      const res = await fetch(`/api/accounts/${accountId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      console.log("Response status:", res.status);
      console.log("Response content-type:", contentType);

      if (!res.ok) {
        // Check if response is JSON before trying to parse
        if (contentType?.includes("application/json")) {
          const error = await res.json();
          throw new Error(error.message || "Failed to update branding");
        } else {
          const text = await res.text();
          console.error("Non-JSON error response:", text.substring(0, 200));
          throw new Error(`Failed to update branding (status ${res.status})`);
        }
      }

      // Check if success response is JSON
      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON success response:", text.substring(0, 200));
        throw new Error("Server returned non-JSON response");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate the accounts query to refetch with new branding
      queryClient.invalidateQueries({ queryKey: [api.accounts.listMy.path] });
    },
  });
}
