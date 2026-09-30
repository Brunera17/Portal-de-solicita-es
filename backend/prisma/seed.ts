import { PrismaClient } from '@prisma/client';
import { popularBanco } from './seed-data';

const prisma = new PrismaClient();

popularBanco(prisma)
  .then(({ usuarios, solicitacoes }) => {
    console.log(`Seed concluído: ${usuarios} usuários, ${solicitacoes} solicitações.`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
