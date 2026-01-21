import 'dotenv/config';
import { db } from '../server/db';
import { buckets } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkBucket() {
    console.log('🔍 Buscando buckets da conta PrimeTI (ID 1)...\n');

    const result = await db.select().from(buckets).where(eq(buckets.accountId, 1));

    if (result.length === 0) {
        console.log('⚠️ Nenhum bucket encontrado para a conta ID 1.');
        process.exit(0);
    }

    console.log('=== LISTA DE BUCKETS ===');
    result.forEach(b => {
        const gbs = (b.sizeBytes || 0) / (1024 * 1024 * 1024);
        console.log(`📦 ${b.name}`);
        console.log(`   - Tamanho (Bytes): ${b.sizeBytes}`);
        console.log(`   - Tamanho (GB):    ${gbs.toFixed(2)} GB`);
        console.log(`   - Objetos:         ${b.objectCount}`);
        console.log('------------------------------');
    });

    process.exit(0);
}

checkBucket().catch(err => {
    console.error('Erro:', err);
    process.exit(1);
});
