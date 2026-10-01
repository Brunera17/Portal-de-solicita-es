/**
 * Seed de demonstração.
 *   npm run db:seed                 → recria os dados de demonstração (apaga solicitações existentes)
 *   tsx prisma/seed.ts --se-vazio   → só popula se o banco não tiver usuários (usado pelo Docker,
 *                                     para que reiniciar o container não apague dados)
 */
import { PrismaClient } from '@prisma/client';
import { popularBanco } from './seed-data';

const prisma = new PrismaClient();
const somenteSeVazio = process.argv.includes('--se-vazio');

async function main() {
  if (somenteSeVazio && (await prisma.usuario.count()) > 0) {
    console.log('Seed ignorado: o banco já possui dados.');
    return;
  }
  const { usuarios, categorias, solicitacoes } = await popularBanco(prisma);
  console.log(`Seed concluído: ${usuarios} usuários, ${categorias} categorias, ${solicitacoes} solicitações.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
