-- Portal de Solicitações Internas: script de criação do banco (PostgreSQL 17)
-- Estrutura final equivalente às migrations em backend/prisma/migrations.
-- Uso: psql -U <usuario> -d <banco> -f database/schema.sql

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "perfil_usuario" AS ENUM ('SOLICITANTE', 'ATENDENTE', 'GERENTE');

-- CreateEnum
CREATE TYPE "status_solicitacao" AS ENUM ('ABERTO', 'EM_ATENDIMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "tipo_notificacao" AS ENUM ('STATUS_ALTERADO', 'NOVO_COMENTARIO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" "perfil_usuario" NOT NULL DEFAULT 'SOLICITANTE',
    "cor_avatar" VARCHAR(20) NOT NULL DEFAULT 'indigo',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "status" "status_solicitacao" NOT NULL DEFAULT 'ABERTO',
    "solicitante_id" INTEGER NOT NULL,
    "responsavel_id" INTEGER,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "solicitacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_status" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "status_anterior" "status_solicitacao",
    "status_novo" "status_solicitacao" NOT NULL,
    "alterado_por_id" INTEGER NOT NULL,
    "alterado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" SERIAL NOT NULL,
    "solicitacao_id" INTEGER NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE INDEX "solicitacoes_status_idx" ON "solicitacoes"("status");

-- CreateIndex
CREATE INDEX "solicitacoes_responsavel_id_status_idx" ON "solicitacoes"("responsavel_id", "status");

-- CreateIndex
CREATE INDEX "solicitacoes_categoria_id_idx" ON "solicitacoes"("categoria_id");

-- CreateIndex
CREATE INDEX "solicitacoes_criado_em_idx" ON "solicitacoes"("criado_em");

-- CreateIndex
CREATE INDEX "solicitacoes_solicitante_id_idx" ON "solicitacoes"("solicitante_id");

-- CreateIndex
CREATE INDEX "historico_status_solicitacao_id_idx" ON "historico_status"("solicitacao_id");

-- CreateIndex
CREATE INDEX "comentarios_solicitacao_id_criado_em_idx" ON "comentarios"("solicitacao_id", "criado_em");

-- CreateIndex
CREATE INDEX "notificacoes_destinatario_id_lida_criado_em_idx" ON "notificacoes"("destinatario_id", "lida", "criado_em");

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_alterado_por_id_fkey" FOREIGN KEY ("alterado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_solicitacao_id_fkey" FOREIGN KEY ("solicitacao_id") REFERENCES "solicitacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

