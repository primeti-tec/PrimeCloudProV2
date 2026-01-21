/**
 * Script: Verificar e Corrigir Storage das Contas
 */

import "dotenv/config";
import { db } from "../server/db";
import { accounts, buckets } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🔍 Verificando uso de armazenamento das contas...\n");

    const allAccounts = await db.select().from(accounts);
    const allBuckets = await db.select().from(buckets);

    console.log("=== ANÁLISE DE ARMAZENAMENTO ===\n");

    for (const acc of allAccounts) {
        const accBuckets = allBuckets.filter((b) => b.accountId === acc.id);
        const totalSize = accBuckets.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);
        const sizeGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
        const storedGB = ((acc.storageUsed || 0) / (1024 * 1024 * 1024)).toFixed(2);

        const needsUpdate = acc.storageUsed !== totalSize;

        console.log(`📁 Conta: ${acc.name} (ID: ${acc.id})`);
        console.log(`   storageUsed atual: ${storedGB} GB`);
        console.log(`   Soma real buckets: ${sizeGB} GB`);
        console.log(`   Buckets: ${accBuckets.length}`);

        if (needsUpdate) {
            console.log(`   ⚠️ DIVERGÊNCIA - Atualizando...`);
            await db
                .update(accounts)
                .set({ storageUsed: totalSize })
                .where(eq(accounts.id, acc.id));
            console.log(`   ✅ Atualizado para ${sizeGB} GB`);
        } else {
            console.log(`   ✅ OK`);
        }
        console.log("");
    }

    console.log("🎉 Verificação concluída!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Erro:", err);
    process.exit(1);
});
