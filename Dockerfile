# build
FROM node:20 AS builder
WORKDIR /app

# Instalar Bun para instalar dependencias más rápido
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copiar archivos de dependencias
COPY package.json bun.lock* ./

# Instalar dependencias con Bun (más rápido que npm)
RUN bun install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Construir la aplicación con Node.js (Next.js funciona mejor con Node.js)
RUN npm run build

# run
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar archivos del build standalone de Next.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]

