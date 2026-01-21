/**
 * Script: Sincronização de Buckets MinIO (Correção Full Scan)
 * 
 * Este script força uma varredura completa em todos os objetos de todos os buckets
 * para garantir que a contagem de tamanho e objetos seja exata, corrigindo o limite de 1000 itens.
 * 
 * Uso: npx tsx script/sync-minio-buckets-full.ts
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

// Função corrigida para ler o stream até o fim
async function getBucketStatsFull(client: Client, bucketName: string): Promise<BucketStats> {
    return new Promise((resolve, reject) => {
        let sizeBytes = 0;
        let objectCount = 0;

        // recursive: true garante que ele entre em subpastas
        const stream = client.listObjectsV2(bucketName, "", true);

        stream.on("data", (obj) => {
            sizeBytes += obj.size || 0;
            objectCount++;

            // Feedback visual a cada 5000 objetos para não parecer travado
            if (objectCount % 5000 === 0) {
                process.stdout.write(`.`);
            }
        });

        stream.on("error", (err) => {
            console.error(`\nErro ao ler bucket ${bucketName}:`, err);
            reject(err);
        });

        stream.on("end", () => {
            // Pular linha após os pontos de progresso
            if (objectCount >= 5000) console.log("");
            resolve({ sizeBytes, objectCount });
        });
    });
}

async function main() {
    console.log("📦 Iniciando Sincronização COMPLETA (Full Scan) MinIO...\n");

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
        console.log("✅ Conexão MinIO OK.\n");
    } catch (err) {
        console.error("❌ Erro MinIO:", err);
        process.exit(1);
    }

    // Listar buckets do MinIO
    const minioBuckets = await minioClient.listBuckets();
    console.log(`☁️  Encontrados ${minioBuckets.length} buckets no MinIO.\n`);

    for (const minioBucket of minioBuckets) {
        const bucketName = minioBucket.name;
        console.log(`🔍 Escaneando bucket: ${bucketName} (pode demorar)...`);

        try {
            const stats = await getBucketStatsFull(minioClient, bucketName);
            const sizeGB = (stats.sizeBytes / (1024 * 1024 * 1024)).toFixed(2);

            console.log(`   📊 Resultado: ${stats.objectCount} objetos | ${sizeGB} GB`);

            // Verificar se bucket existe no DB
            const existingBucket = await db.query.buckets.findFirst({
                where: eq(buckets.name, bucketName),
            });

            if (existingBucket) {
                // Atualizar estatísticas
                console.log(`   🔄 Atualizando registro no banco...`);
                await db
                    .update(buckets)
                    .set({
                        sizeBytes: stats.sizeBytes,
                        objectCount: stats.objectCount,
                        accountId: existingBucket.accountId // Mantém a conta atual
                    })
                    .where(eq(buckets.id, existingBucket.id));
            } else {
                // Criar registro novo (vinculado à PrimeTI por padrão se não tiver dono)
                console.log(`   ✨ Novo bucket encontrado! Registrando...`);

                // Tentar achar conta PrimeTI
                // (Simplificado: accountId 1 é PrimeTI, mas vamos buscar para garantir)
                const accountsList = await db.select().from(accounts);
                let targetAccountId = 1; // Default
                const primeti = accountsList.find(a => a.name.toLowerCase().includes("primeti"));
                if (primeti) targetAccountId = primeti.id;

                await db.insert(buckets).values({
                    accountId: targetAccountId,
                    name: bucketName,
                    region: "us-east-1",
                    isPublic: false,
                    objectCount: stats.objectCount,
                    sizeBytes: stats.sizeBytes,
                    createdAt: minioBucket.creationDate,
                });
            }

        } catch (err) {
            console.error(`   ❌ Falha ao processar ${bucketName}:`, err);
        }
        console.log("-".repeat(40));
    }

    // Atualizar totais das contas
    console.log("\n🔄 Recalculando totais de uso das contas...");
    const allBuckets = await db.select().from(buckets);
    const allAccounts = await db.select().from(accounts);

    for (const acc of allAccounts) {
        const accBuckets = allBuckets.filter(b => b.accountId === acc.id);
        const totalBytes = accBuckets.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);

        if (acc.storageUsed !== totalBytes) {
            await db.update(accounts).set({ storageUsed: totalBytes }).where(eq(accounts.id, acc.id));
            console.log(`   ✅ Conta ${acc.name}: storage atualizado.`);
        }
    }

    console.log("\n🎉 Sincronização Completa Finalizada!");
    process.exit(0);
}

main().catch(console.error);
