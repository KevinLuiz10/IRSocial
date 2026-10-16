# Estágio 1: Construir o Frontend
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Estágio 2: Configurar o Backend e Servir
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
# Migracoes SQL tambem devem estar disponiveis para bancos ja existentes.
COPY db/migrations/ /app/db/migrations/

# Copia os arquivos do React compilados (dist) para a pasta public do backend
COPY --from=build-frontend /app/frontend/dist ./public

EXPOSE 8080
# Confere migrações e dados oficiais antes de disponibilizar o servidor.
# exec entrega os sinais do Docker diretamente ao processo Node/Express.
CMD ["sh", "-c", "node scripts/preparar-ambiente.js && exec node server.js"]