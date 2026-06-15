# Sistema de Migrations - Hapvida Status Macro

## Persistência de Dados

Os dados do banco MySQL são persistidos através do volume `db_data` definido no docker-compose.yml:

```yaml
volumes:
  - db_data:/var/lib/mysql
```

**IMPORTANTE**: Para manter os dados entre restarts:
- Use `docker compose restart` para reiniciar sem perder dados
- Use `docker compose down` (sem `-v`) para parar mas manter o volume
- Use `docker compose down -v` apenas quando quiser **resetar tudo** (APAGA TODOS OS DADOS)

## Sistema de Migrations

As migrations estão em `/db/migrations/` e são aplicadas automaticamente quando:
1. O banco é criado pela primeira vez (via `init.sql`)
2. As migrations são aplicadas em ordem numérica crescente

### Aplicar Migrations Manualmente

Se você adicionou novas migrations e quer aplicá-las em um banco existente:

```bash
# Dentro do container do banco
docker exec -it hapvida_db bash
mysql -u root -p$MYSQL_ROOT_PASSWORD hapvida_status < /docker-entrypoint-initdb.d/migrations/001_add_user_management_fields.sql
```

Ou do host:

```bash
docker exec -i hapvida_db mysql -u root -p${MYSQL_ROOT_PASSWORD} hapvida_status < db/migrations/001_add_user_management_fields.sql
```

### Criar Nova Migration

1. Crie um arquivo em `/db/migrations/` com nome sequencial:
   ```
   002_nome_da_migration.sql
   ```

2. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` para garantir idempotência:
   ```sql
   ALTER TABLE tabela
     ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(255);
   ```

3. Aplique manualmente conforme comando acima

## Comandos Úteis

### Rebuild completo (PERDE DADOS)
```bash
docker compose down -v
docker compose up --build -d
```

### Rebuild preservando dados
```bash
docker compose down
docker compose up --build -d
```

### Restart rápido
```bash
docker compose restart
```

### Backup do banco
```bash
docker exec hapvida_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD hapvida_status > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup
```bash
docker exec -i hapvida_db mysql -u root -p$MYSQL_ROOT_PASSWORD hapvida_status < backup_20260612_143000.sql
```
