import { useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";

type AuthUser = {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string;
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

  return {
    user: mappedUser,
    isLoading: !isLoaded,
    isAuthenticated: !!mappedUser,
    logout,
    isLoggingOut,
  };
}
