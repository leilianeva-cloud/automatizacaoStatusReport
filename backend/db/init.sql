-- ─── Hapvida Status Macro — Schema ───────────────────────────────────────────
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS hapvida_status
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hapvida_status;

-- ─── Usuários ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  VARCHAR(36)  NOT NULL,
  name                VARCHAR(120) NOT NULL,
  email               VARCHAR(191) NOT NULL,
  password_hash       VARCHAR(255) NOT NULL,
  is_admin            TINYINT(1)   NOT NULL DEFAULT 0,
  is_active           TINYINT(1)   NOT NULL DEFAULT 1,
  must_change_password TINYINT(1)  NOT NULL DEFAULT 0,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Portfólio importado (rows brutas do XLS) ────────────────────────────────
-- Cada usuário tem no máximo 1 registro (última importação).
-- As rows ficam como JSON array para manter fidelidade à estrutura original.
CREATE TABLE IF NOT EXISTS user_portfolio (
  user_id      VARCHAR(36) NOT NULL,
  rows_json    LONGTEXT    NOT NULL,          -- JSON array de arrays (rows brutas)
  imported_at  VARCHAR(20) NOT NULL DEFAULT '',
  updated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_portfolio_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Projetos do report ───────────────────────────────────────────────────────
-- Cada projeto é identificado pelo campo `id` do App (string composta: "LECOM:idx" ou "manual:xxx").
-- Toda a estrutura aninhada (projeto, raias, fases, pacotes) é armazenada como JSON
-- para manter compatibilidade total com o App.jsx sem necessidade de joins complexos.
CREATE TABLE IF NOT EXISTS report_projects (
  id           VARCHAR(255) NOT NULL,
  user_id      VARCHAR(36)  NOT NULL,
  n_futuros    INT          NOT NULL DEFAULT 1,
  n_passados   INT          NOT NULL DEFAULT 0,
  usa_pacotes  TINYINT(1)   NOT NULL DEFAULT 0,
  projeto_json LONGTEXT     NOT NULL,          -- JSON: objeto projeto (nome, smPmo, etc.)
  raias_json   LONGTEXT     NOT NULL,          -- JSON: array de raias (demandas/marcos + fases)
  pacotes_json LONGTEXT     NOT NULL,          -- JSON: array de pacotes
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id, user_id),
  CONSTRAINT fk_rp_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
