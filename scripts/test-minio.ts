
import "dotenv/config";
import { minioService } from "../server/services/minio.service";

async function testConnection() {
    console.log("🔄 Testando conexão com MinIO...");
    console.log(`📡 Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);

    if (!minioService.isAvailable()) {
        console.log("⚠️ Serviço MinIO reporta indisponibilidade (variáveis de ambiente carregadas?)");
    }

    try {
        const buckets = await minioService.listBuckets();
        console.log("✅ Conexão BEM SUCEDIDA!");
        console.log(`📦 Buckets encontrados: ${buckets.length}`);
        buckets.forEach(b => console.log(`   - ${b.name} (${b.creationDate})`));

        // Teste de criação (opcional, para não sujar o ambiente, comentamos)
        // console.log("🔄 Tentando criar bucket de teste 'conexao-teste'...");
        // const createResult = await minioService.createBucket('conexao-teste');
        // console.log(createResult.success ? "✅ Bucket criado" : `❌ Erro ao criar: ${createResult.error}`);

    } catch (error) {
        console.error("❌ FALHA na conexão:", error);
    }
}

// Aguardar inicialização do serviço (evitar race condition)
setTimeout(() => {
    testConnection();
}, 2000);
