#!/usr/bin/env bash
# Prepara carpetas y arranca el centro multimedia (macOS / Linux)
set -e
cd "$(dirname "$0")"

[ -f .env ] || cp env.example .env

for d in Peliculas Series Documentales Musica Podcasts Audiolibros; do
  mkdir -p "Media/$d"
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado. Instálalo desde https://www.docker.com/products/docker-desktop/"
  exit 1
fi

docker compose up -d
echo
echo "Listo. Abre el panel en http://localhost:3000"
