# API do Portal de Solicitações — imagem de produção em múltiplas etapas.

# ---- base: Node + bibliotecas de sistema exigidas pelo Prisma (openssl) e fuso horário
FROM node:24-alpine AS base
RUN apk add --no-cache openssl tzdata
WORKDIR /app

# ---- dependências (camada reaproveitada enquanto o package-lock não mudar)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: gera o cliente Prisma para Alpine (musl) e compila o TypeScript
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ---- execução
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3333 \
    TZ=America/Sao_Paulo
# node_modules completo: o CLI do Prisma (migrations) e o tsx (seed) são usados na inicialização
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER node
EXPOSE 3333

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3333/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
