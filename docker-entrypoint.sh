#!/bin/sh
set -e

echo "🚀 Iniciando Container PrimeCloudPro..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não definida!"
  exit 1
fi

echo "🔄 Sincronizando Schema do Banco de Dados..."
# O drizzle-kit push vai garantir que as tabelas existam
npx drizzle-kit push

echo "✅ Banco de Dados Sincronizado!"

echo "⚡ Iniciando Servidor..."
exec node dist/index.cjs
