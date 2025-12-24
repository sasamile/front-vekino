#!/bin/bash
# Script para construir en EC2 con configuración optimizada

echo "🚀 Iniciando build en EC2..."

# Configurar variables de entorno para el build
export NODE_OPTIONS="--max-old-space-size=2048"
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Limpiar builds anteriores si es necesario
echo "🧹 Limpiando builds anteriores..."
docker compose down 2>/dev/null || true
docker system prune -f

# Construir con límites de memoria
echo "🔨 Construyendo imagen..."
docker compose build --progress=plain --no-cache

# Si el build falla, intentar sin cache
if [ $? -ne 0 ]; then
  echo "⚠️  Build falló, intentando sin cache..."
  docker compose build --no-cache --progress=plain
fi

# Iniciar contenedor
echo "▶️  Iniciando contenedor..."
docker compose up -d

echo "✅ Build completado!"
echo "📊 Ver logs con: docker compose logs -f"

