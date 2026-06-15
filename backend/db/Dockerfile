FROM mysql:8.0
ENV MYSQL_CHARSET=utf8mb4
ENV MYSQL_COLLATION=utf8mb4_unicode_ci

# Copia migrations para serem aplicadas
COPY migrations /docker-entrypoint-initdb.d/migrations/
COPY run-migrations.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/run-migrations.sh
