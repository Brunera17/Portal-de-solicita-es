# Interface web do Portal de Solicitações — build estático servido pelo Nginx.

# ---- build
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Variáveis VITE_* são embutidas no build (não podem mudar depois sem rebuild)
ARG VITE_API_URL=/api
ARG VITE_EXIBIR_USUARIOS_DEMO=true
ENV VITE_API_URL=$VITE_API_URL \
    VITE_EXIBIR_USUARIOS_DEMO=$VITE_EXIBIR_USUARIOS_DEMO
RUN npm run build

# ---- execução
FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
