import 'dotenv/config';
import { storage } from "../server/storage";
import { accounts } from "../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    try {
        console.log("Fetching accounts...");
        const allAccounts = await storage.getAllAccounts();
        const primeti = allAccounts.find(a => a.name.toLowerCase().includes("primeti") || a.customDomain?.includes("primeti"));

        if (!primeti) {
            console.error("PrimeTI account not found");
            process.exit(1);
        }

        console.log(`Found PrimeTI (ID: ${primeti.id}). Current Imperius Count: ${primeti.imperiusLicenseCount}`);

        console.log("Updating to 5...");
        const updated = await storage.updateAccount(primeti.id, { imperiusLicenseCount: 5 });
        console.log(`Updated. New Count in Object: ${updated.imperiusLicenseCount}`);

        // Fetch again to be sure
        const check = await storage.getAccount(primeti.id);
        console.log(`Refetched Count: ${check?.imperiusLicenseCount}`);

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

run();
