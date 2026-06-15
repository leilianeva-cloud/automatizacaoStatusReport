#!/bin/bash
set -e

echo "==> Iniciando setup do banco de dados..."

# Aguarda o MySQL estar pronto
until mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" &>/dev/null; do
  echo "Aguardando MySQL inicializar..."
  sleep 2
done

echo "==> MySQL pronto. Aplicando migrations..."

# Aplica todas as migrations na ordem
for migration in /docker-entrypoint-initdb.d/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Executando migration: $(basename $migration)"
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "$migration" || echo "Migration já aplicada ou erro: $(basename $migration)"
  fi
done

echo "==> Setup do banco concluído!"
