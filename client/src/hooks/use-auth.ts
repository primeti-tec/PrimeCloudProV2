import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClerk, useUser } from "@clerk/clerk-react";

type AuthUser = {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string;
};

type AuthProfile = {
  user: AuthUser | null;
  isSuperAdmin: boolean;
};

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const mappedUser = useMemo<AuthUser | null>(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.imageUrl,
    };
  }, [user]);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirectUrl: "/" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const { data: authProfile, isLoading: isProfileLoading } = useQuery<AuthProfile>({
    queryKey: ["auth", "profile"],
    enabled: !!user,
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) return { user: null, isSuperAdmin: false };
      if (!res.ok) throw new Error("Failed to fetch auth profile");
      return res.json();
    },
  });

  const isLoading = !isLoaded || (!!user && isProfileLoading);

  return {
    user: mappedUser,
    isLoading,
    isAuthenticated: !!mappedUser,
    isSuperAdmin: authProfile?.isSuperAdmin ?? false,
    logout,
    isLoggingOut,
  };
}
