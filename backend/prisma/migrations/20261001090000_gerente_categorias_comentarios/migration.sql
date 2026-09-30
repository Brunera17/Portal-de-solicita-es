-- Perfil GERENTE (hierarquia: SOLICITANTE < ATENDENTE < GERENTE)
ALTER TYPE "perfil_usuario" ADD VALUE 'GERENTE';

-- Personalização de perfil
ALTER TABLE "usuarios"
  ADD COLUMN "cor_avatar" VARCHAR(20) NOT NULL DEFAULT 'indigo',
  ADD COLUMN "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Categorias deixam de ser enum e passam a ser uma tabela administrável
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

INSERT INTO "categorias" ("nome") VALUES
  ('TI'), ('RH'), ('Compras'), ('Financeiro'), ('Infraestrutura');

-- Migração dos dados: converte o valor do enum antigo para a chave da nova tabela
ALTER TABLE "solicitacoes" ADD COLUMN "categoria_id" INTEGER;

UPDATE "solicitacoes" s
   SET "categoria_id" = c."id"
  FROM "categorias" c
 WHERE c."nome" = CASE s."categoria"
                    WHEN 'TI' THEN 'TI'
                    WHEN 'RH' THEN 'RH'
                    WHEN 'COMPRAS' THEN 'Compras'
                    WHEN 'FINANCEIRO' THEN 'Financeiro'
                    WHEN 'INFRAESTRUTURA' THEN 'Infraestrutura'
                  END;

ALTER TABLE "solicitacoes" ALTER COLUMN "categoria_id" SET NOT NULL;

DROP INDEX "solicitacoes_categoria_idx";
ALTER TABLE "solicitacoes" DROP COLUMN "categoria";
DROP TYPE "categoria_solicitacao";

CREATE INDEX "solicitacoes_categoria_id_idx" ON "solicitacoes"("categoria_id");
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_categoria_id_fkey"
  FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Comentários (imutáveis; "interno" = visível apenas para a equipe)
CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "comentarios_solicitacao_id_criado_em_idx" ON "comentarios"("solicitacao_id", "criado_em");

ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_solicitacao_id_fkey"
  FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autor_id_fkey"
  FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
