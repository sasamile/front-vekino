# build
FROM node:20 AS builder
WORKDIR /app

# Instalar Bun
RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copiar archivos de dependencias
COPY package.json bun.lock* ./

# Instalar dependencias
RUN bun install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Evitar que Node reviente por RAM en builds pequeños (EC2 micro)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Build (usa bun)
RUN bun run build

# run
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
