/**
 * Script: Migrar Bucket para Outra Conta
 * 
 * Uso: npx tsx script/migrate-bucket.ts
 */

import "dotenv/config";
import { db } from "../server/db";
import { accounts, buckets } from "../shared/schema";
import { eq } from "drizzle-orm";

const BUCKET_NAME = "tenant-dicorel";
const TARGET_ACCOUNT_NAME = "dicorel";

async function main() {
    console.log("🔄 Iniciando migração de bucket...\n");

    // Buscar conta destino
    const allAccounts = await db.select().from(accounts);
    const targetAccount = allAccounts.find(
        (a) => a.name.toLowerCase().includes(TARGET_ACCOUNT_NAME.toLowerCase())
    );

    if (!targetAccount) {
        console.log("❌ Conta destino não encontrada. Contas disponíveis:");
        allAccounts.forEach((a) => console.log(`   - ${a.name} (ID: ${a.id})`));
        process.exit(1);
    }

    // Buscar bucket
    const allBuckets = await db.select().from(buckets);
    const targetBucket = allBuckets.find((b) => b.name === BUCKET_NAME);

    if (!targetBucket) {
        console.log(`❌ Bucket não encontrado: ${BUCKET_NAME}`);
        console.log("   Buckets disponíveis:");
        allBuckets.forEach((b) => console.log(`   - ${b.name}`));
        process.exit(1);
    }

    const sourceAccount = allAccounts.find((a) => a.id === targetBucket.accountId);

    console.log(`📦 Bucket: ${BUCKET_NAME}`);
    console.log(`🏢 Conta atual: ${sourceAccount?.name || "Desconhecida"} (ID: ${targetBucket.accountId})`);
    console.log(`🎯 Conta destino: ${targetAccount.name} (ID: ${targetAccount.id})`);

    // Atualizar
    await db
        .update(buckets)
        .set({ accountId: targetAccount.id })
        .where(eq(buckets.id, targetBucket.id));

    console.log("\n✅ Bucket migrado com sucesso!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Erro fatal:", err);
    process.exit(1);
});
