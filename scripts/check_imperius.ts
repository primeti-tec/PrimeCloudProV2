
import { storage } from "../server/storage";

async function run() {
    const accounts = await storage.getAllAccounts();
    const primeti = accounts.find(a => a.name.toLowerCase().includes("primeti") || a.customDomain?.includes("primeti"));

    if (!primeti) {
        console.log("Account 'PrimeTI' not found.");
    } else {
        console.log("Found PrimeTI Account:");
        console.log("ID:", primeti.id);
        console.log("Name:", primeti.name);
        console.log("Imperius License Count:", (primeti as any).imperiusLicenseCount);
    }
    process.exit(0);
}

run().catch(console.error);
