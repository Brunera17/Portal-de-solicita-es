#!/bin/sh
# Inicialização do container da API: estrutura do banco, dados de demonstração e servidor.
set -e

echo "[entrypoint] Aplicando migrations..."
npx prisma migrate deploy

# Popula apenas se o banco estiver vazio: reiniciar o container não apaga dados
if [ "$SEED_DEMO" = "true" ]; then
  echo "[entrypoint] Verificando dados de demonstração..."
  npx tsx prisma/seed.ts --se-vazio
fi

echo "[entrypoint] Iniciando a API..."
exec node dist/server.js
