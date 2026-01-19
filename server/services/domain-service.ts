import dns from "dns";
import { promisify } from "util";
import crypto from "crypto";

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

export interface DomainVerificationResult {
  verified: boolean;
  recordType: "CNAME" | "TXT" | null;
  message: string;
}

/**
 * Generate a unique DNS verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verify domain ownership via DNS records
 * Supports both CNAME and TXT record verification
 */
export async function verifyDomainOwnership(
  domain: string,
  verificationToken: string,
  targetCname: string = "app.primecloudpro.com.br"
): Promise<DomainVerificationResult> {
  try {
    // Remove protocol if present
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // First, try CNAME verification
    try {
      const cnameRecords = await resolveCname(cleanDomain);

      // Check if CNAME points to our target
      if (cnameRecords && cnameRecords.length > 0) {
        const pointsToUs = cnameRecords.some(record =>
          record.toLowerCase().includes(targetCname.toLowerCase())
        );

        if (pointsToUs) {
          return {
            verified: true,
            recordType: "CNAME",
            message: `CNAME record verified. ${cleanDomain} points to ${cnameRecords[0]}`,
          };
        }
      }
    } catch (cnameError: any) {
      // CNAME not found, continue to TXT verification
      console.log(`CNAME verification failed for ${cleanDomain}:`, cnameError.message);
    }

    // If CNAME verification fails, try TXT record verification
    try {
      const txtRecords = await resolveTxt(cleanDomain);

      // Look for our verification token in TXT records
      const verificationRecord = txtRecords.find(record => {
        const txtValue = Array.isArray(record) ? record.join("") : record;
        return txtValue.includes(`primecloudpro-verification=${verificationToken}`);
      });

      if (verificationRecord) {
        return {
          verified: true,
          recordType: "TXT",
          message: `TXT record verified. Verification token found.`,
        };
      }

      return {
        verified: false,
        recordType: null,
        message: `TXT record found but does not contain the verification token. Add: primecloudpro-verification=${verificationToken}`,
      };
    } catch (txtError: any) {
      return {
        verified: false,
        recordType: null,
        message: `No valid DNS records found. Please configure either:\n1. CNAME record pointing to ${targetCname}\n2. TXT record with: primecloudpro-verification=${verificationToken}`,
      };
    }
  } catch (error: any) {
    console.error("Domain verification error:", error);
    return {
      verified: false,
      recordType: null,
      message: `DNS verification failed: ${error.message}`,
    };
  }
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

  return domainRegex.test(cleanDomain);
}

/**
 * Check if domain is already in use by another account
 */
export function isDomainUnique(
  domain: string,
  accounts: Array<{ id: number; customDomain: string | null }>,
  currentAccountId?: number
): boolean {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();

  return !accounts.some(account => {
    // Skip current account when checking for uniqueness
    if (currentAccountId && account.id === currentAccountId) {
      return false;
    }

    return account.customDomain?.toLowerCase() === cleanDomain;
  });
}
