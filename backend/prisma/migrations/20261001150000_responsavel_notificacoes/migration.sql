-- CreateEnum
CREATE TYPE "tipo_notificacao" AS ENUM ('STATUS_ALTERADO', 'NOVO_COMENTARIO');

-- AlterTable
ALTER TABLE "solicitacoes" ADD COLUMN     "responsavel_id" INTEGER;

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "destinatario_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "tipo" "tipo_notificacao" NOT NULL,
    "mensagem" VARCHAR(300) NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_destinatario_id_lida_criado_em_idx" ON "notificacoes"("destinatario_id", "lida", "criado_em");

-- CreateIndex
CREATE INDEX "solicitacoes_responsavel_id_status_idx" ON "solicitacoes"("responsavel_id", "status");

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Dados existentes: o responsável é quem levou a solicitação para EM_ATENDIMENTO (mais recente)
UPDATE "solicitacoes" s
   SET "responsavel_id" = h."alterado_por_id"
  FROM (
    SELECT DISTINCT ON ("solicitacao_id") "solicitacao_id", "alterado_por_id"
      FROM "historico_status"
     WHERE "status_novo" = 'EM_ATENDIMENTO'
     ORDER BY "solicitacao_id", "alterado_em" DESC
  ) h
 WHERE h."solicitacao_id" = s."id"
   AND s."status" IN ('EM_ATENDIMENTO', 'CONCLUIDO');
