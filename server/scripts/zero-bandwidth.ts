
import { db } from "../db";
import { products } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function run() {
    console.log("Updating product bandwidth prices to 0...");

    try {
        const res = await db.update(products)
            .set({ pricePerTransferGB: 0 })
            .returning({ name: products.name, price: products.pricePerTransferGB });

        console.log("Updated products:", res);
        console.log("Success! Bandwidth cost is now zeroed.");
    } catch (error) {
        console.error("Error updating products:", error);
    } finally {
        process.exit(0);
    }
}

run();
