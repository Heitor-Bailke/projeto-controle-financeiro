#!/bin/bash
set -euo pipefail
FILE=${1:-backups/contas_latest.sql}
docker compose exec -T db psql -U contas -d contas < "$FILE"
echo "Restore concluído a partir de $FILE"
