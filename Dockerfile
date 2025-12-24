# Dockerfile para Next.js
FROM node:20-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
# Verificar si el usuario tiene permisos para instalar paquetes
RUN apk add --no-cache libc6-compat curl unzip bash
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json bun.lock* ./
RUN \
  if [ -f bun.lock ]; then \
    curl -fsSL https://bun.sh/install | bash && \
    export PATH="$HOME/.bun/bin:$PATH" && \
    /root/.bun/bin/bun install; \
  else \
    npm ci; \
  fi

# Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
RUN apk add --no-cache curl bash
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desactivar telemetría de Next.js durante el build
ENV NEXT_TELEMETRY_DISABLED 1

# Variables de entorno para optimizar el build en EC2 (limitar uso de memoria)
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NEXT_TELEMETRY_DISABLED=1

RUN \
  if [ -f bun.lock ]; then \
    curl -fsSL https://bun.sh/install | bash && \
    export PATH="$HOME/.bun/bin:$PATH" && \
    echo "Building with bun..." && \
    /root/.bun/bin/bun run build; \
  else \
    echo "Building with npm..." && \
    npm run build; \
  fi

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Establecer el permiso correcto para el archivo .next
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar archivos de build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]


