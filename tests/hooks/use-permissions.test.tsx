import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentAccount } from "@/hooks/use-current-account";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-current-account", () => ({
  useCurrentAccount: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseCurrentAccount = vi.mocked(useCurrentAccount);

describe("usePermissions", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUseCurrentAccount.mockReset();
  });

  it("returns developer defaults when no account is selected", () => {
    mockUseAuth.mockReturnValue({ isSuperAdmin: false });
    mockUseCurrentAccount.mockReturnValue({ account: null });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.role).toBe("developer");
    expect(result.current.isExternalClient).toBe(false);
    expect(result.current.canViewBilling).toBe(true);
    expect(result.current.canAccessAdmin).toBe(false);
  });

  it("marks external client permissions correctly", () => {
    mockUseAuth.mockReturnValue({ isSuperAdmin: false });
    mockUseCurrentAccount.mockReturnValue({ account: { role: "external_client" } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isExternalClient).toBe(true);
    expect(result.current.canViewBilling).toBe(false);
    expect(result.current.canViewSettings).toBe(false);
    expect(result.current.canManageMembers).toBe(false);
  });

  it("grants admin access when isSuperAdmin is true", () => {
    mockUseAuth.mockReturnValue({ isSuperAdmin: true });
    mockUseCurrentAccount.mockReturnValue({ account: { role: "developer" } });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canAccessAdmin).toBe(true);
  });
});
