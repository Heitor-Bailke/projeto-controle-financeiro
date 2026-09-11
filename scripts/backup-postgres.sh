#!/bin/bash
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p backups
docker compose exec -T db pg_dump -U contas contas > "backups/contas_$TIMESTAMP.sql"
echo "Backup criado em backups/contas_$TIMESTAMP.sql"
