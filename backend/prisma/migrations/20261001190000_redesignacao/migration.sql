-- AlterEnum
ALTER TYPE "tipo_notificacao" ADD VALUE 'REDESIGNADA';

-- CreateTable
CREATE TABLE "redesignacoes" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "de_responsavel_id" INTEGER NOT NULL,
    "para_responsavel_id" INTEGER NOT NULL,
    "redesignado_por_id" INTEGER NOT NULL,
    "motivo" VARCHAR(300),
    "redesignado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redesignacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "redesignacoes_solicitacao_id_idx" ON "redesignacoes"("solicitacao_id");

-- AddForeignKey
ALTER TABLE "redesignacoes" ADD CONSTRAINT "redesignacoes_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redesignacoes" ADD CONSTRAINT "redesignacoes_de_responsavel_id_fkey" FOREIGN KEY ("de_responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redesignacoes" ADD CONSTRAINT "redesignacoes_para_responsavel_id_fkey" FOREIGN KEY ("para_responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redesignacoes" ADD CONSTRAINT "redesignacoes_redesignado_por_id_fkey" FOREIGN KEY ("redesignado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Garantia no próprio banco: não existe redesignação para a mesma pessoa
ALTER TABLE "redesignacoes" ADD CONSTRAINT "redesignacoes_responsaveis_distintos_chk"
  CHECK ("de_responsavel_id" <> "para_responsavel_id");
