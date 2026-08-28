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

# Copia os arquivos do React compilados (dist) para a pasta public do backend
COPY --from=build-frontend /app/frontend/dist ./public

EXPOSE 8080
CMD ["node", "server.js"]