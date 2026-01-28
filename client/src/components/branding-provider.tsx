import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useCurrentAccount } from "@/hooks/use-current-account";

interface BrandingConfig {
  name: string;
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  sidebarColor: string;
  iconUrl?: string | null;
  themeColor?: string | null;
}

const defaultBranding: BrandingConfig = {
  name: "Prime Cloud Pro",
  logo: null,
  favicon: null,
  primaryColor: "#2563eb", // blue-600
  sidebarColor: "#1e293b", // slate-800
  iconUrl: null,
  themeColor: "#2563eb",
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

export function useBranding() {
  return useContext(BrandingContext);
}

interface BrandingProviderProps {
  children: ReactNode;
}

export function BrandingProvider({ children }: BrandingProviderProps) {
  const { account } = useCurrentAccount();

  // Use default branding if no account is available (e.g., before login)
  const branding: BrandingConfig = account ? {
    name: account.brandingName || defaultBranding.name,
    logo: account.brandingLogo || defaultBranding.logo,
    favicon: account.brandingFavicon || defaultBranding.favicon,
    primaryColor: account.brandingPrimaryColor || defaultBranding.primaryColor,
    sidebarColor: account.brandingSidebarColor || defaultBranding.sidebarColor,
    iconUrl: account.brandingIconUrl || defaultBranding.iconUrl,
    themeColor: account.brandingThemeColor || account.brandingPrimaryColor || defaultBranding.themeColor,
  } : defaultBranding;

  // Inject CSS variables for colors
  useEffect(() => {
    const root = document.documentElement;

    // Convert hex to HSL for better CSS variable integration
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return "222.2 84% 4.9%"; // fallback

      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);

      return `${h} ${s}% ${l}%`;
    };

    // Set primary color
    root.style.setProperty("--primary", hexToHSL(branding.primaryColor));

    // Set sidebar color (custom variable)
    root.style.setProperty("--sidebar-bg", branding.sidebarColor);

    // Update favicon if provided
    if (branding.favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = branding.favicon;
      }
    }

    // Update Apple Touch Icon
    if (branding.iconUrl) {
      const appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (appleIcon) {
        appleIcon.href = branding.iconUrl;
      }
    }

    // Update Meta Theme Color
    if (branding.themeColor) {
      const metaTheme = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
      if (metaTheme) {
        metaTheme.content = branding.themeColor;
      }
    }

    // Update document title
    document.title = `${branding.name} - Backup Corporativo`;
  }, [branding]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}
