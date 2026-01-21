/**
 * Script: Sincronização de Buckets MinIO para Conta PrimeTI
 * 
 * Este script executa o plano descrito em .context/plans/sincronizacao-buckets-minio.md
 * 
 * Uso: npx tsx script/sync-minio-buckets.ts
 */

import "dotenv/config";
import { db } from "../server/db";
import { accounts, buckets } from "../shared/schema";
import { eq } from "drizzle-orm";
import { Client } from "minio";

interface BucketStats {
    sizeBytes: number;
    objectCount: number;
}

async function getBucketStats(client: Client, bucketName: string): Promise<BucketStats> {
    return new Promise((resolve, reject) => {
        let sizeBytes = 0;
        let objectCount = 0;

        const stream = client.listObjects(bucketName, "", true);
        stream.on("data", (obj) => {
            sizeBytes += obj.size || 0;
            objectCount++;
        });
        stream.on("error", reject);
        stream.on("end", () => resolve({ sizeBytes, objectCount }));
    });
}

async function main() {
    console.log("📦 Iniciando sincronização de buckets MinIO → PostgreSQL...\n");

    // 1. Inicializar cliente MinIO
    const minioClient = new Client({
        endPoint: process.env.MINIO_ENDPOINT || "localhost",
        port: parseInt(process.env.MINIO_PORT || "9000"),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: process.env.MINIO_ROOT_USER || "minioadmin",
        secretKey: process.env.MINIO_ROOT_PASSWORD || "minioadmin",
    });

    // Testar conexão
    try {
        await minioClient.listBuckets();
        console.log("✅ Conexão com MinIO estabelecida.\n");
    } catch (err) {
        console.error("❌ Falha ao conectar ao MinIO:", (err as Error).message);
        process.exit(1);
    }

    // 2. Localizar conta PrimeTI
    const allAccounts = await db.select().from(accounts);
    const primetiAccount = allAccounts.find(
        (a) => a.name.toLowerCase().includes("primeti") || a.name.toLowerCase().includes("prime ti")
    );

    if (!primetiAccount) {
        console.error("❌ Conta PrimeTI não encontrada no banco de dados.");
        console.log("   Contas disponíveis:", allAccounts.map((a) => a.name).join(", "));
        process.exit(1);
    }

    console.log(`🏢 Conta destino: ${primetiAccount.name} (ID: ${primetiAccount.id})\n`);

    // 3. Listar buckets já registrados no PostgreSQL
    const registeredBuckets = await db.select().from(buckets);
    const registeredNames = new Set(registeredBuckets.map((b) => b.name.toLowerCase()));

    console.log(`📋 Buckets já registrados no DB: ${registeredBuckets.length}`);

    // 4. Listar buckets do MinIO
    const minioBuckets = await minioClient.listBuckets();
    console.log(`☁️  Buckets encontrados no MinIO: ${minioBuckets.length}\n`);

    // 5. Sincronizar buckets órfãos
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const importedDetails: string[] = [];

    for (const minioBucket of minioBuckets) {
        const bucketName = minioBucket.name;

        // Verificar se já existe
        if (registeredNames.has(bucketName.toLowerCase())) {
            skippedCount++;
            continue;
        }

        // Tentar identificar dono pelo prefixo tenant-{ID}-
        let targetAccountId = primetiAccount.id;
        const tenantMatch = bucketName.match(/^tenant-(\d+)-/);
        if (tenantMatch) {
            const potentialId = parseInt(tenantMatch[1], 10);
            const existingAccount = allAccounts.find((a) => a.id === potentialId);
            if (existingAccount) {
                targetAccountId = existingAccount.id;
            }
        }

        // Coletar métricas do bucket
        try {
            console.log(`📊 Analisando bucket: ${bucketName}...`);
            const stats = await getBucketStats(minioClient, bucketName);

            // Inserir no banco de dados
            await db.insert(buckets).values({
                accountId: targetAccountId,
                name: bucketName,
                region: "us-east-1",
                isPublic: false,
                objectCount: stats.objectCount,
                sizeBytes: stats.sizeBytes,
                createdAt: minioBucket.creationDate,
            });

            importedCount++;
            const sizeGB = (stats.sizeBytes / (1024 * 1024 * 1024)).toFixed(2);
            importedDetails.push(
                `   ✅ ${bucketName} → Conta ID ${targetAccountId} (${stats.objectCount} objetos, ${sizeGB} GB)`
            );
        } catch (err) {
            errorCount++;
            console.error(`   ❌ Erro ao processar ${bucketName}:`, (err as Error).message);
        }
    }

    // 6. Relatório final
    console.log("\n" + "=".repeat(60));
    console.log("📈 RELATÓRIO DE SINCRONIZAÇÃO");
    console.log("=".repeat(60));
    console.log(`✅ Buckets importados: ${importedCount}`);
    console.log(`⏭️  Buckets ignorados (já existiam): ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    if (importedDetails.length > 0) {
        console.log("\n📦 Detalhes dos buckets importados:");
        importedDetails.forEach((d) => console.log(d));
    }

    // 7. Atualizar storage_used das contas afetadas
    if (importedCount > 0) {
        console.log("\n🔄 Atualizando contagem de storage das contas...");
        const accountBuckets = await db.select().from(buckets);
        const storageByAccount = new Map<number, number>();

        for (const b of accountBuckets) {
            if (b.accountId) {
                const current = storageByAccount.get(b.accountId) || 0;
                storageByAccount.set(b.accountId, current + (b.sizeBytes || 0));
            }
        }

        for (const [accountId, totalBytes] of storageByAccount) {
            await db
                .update(accounts)
                .set({ storageUsed: totalBytes })
                .where(eq(accounts.id, accountId));
        }
        console.log("✅ Storage atualizado para todas as contas afetadas.");
    }

    console.log("\n🎉 Sincronização concluída!\n");
    process.exit(0);
}

main().catch((err) => {
    console.error("Erro fatal:", err);
    process.exit(1);
});
