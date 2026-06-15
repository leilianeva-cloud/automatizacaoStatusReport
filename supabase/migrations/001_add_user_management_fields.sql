-- Migração: Adicionar campos de gestão de usuários
-- Data: 2026-06-12
-- Descrição: Adiciona is_admin, is_active, must_change_password e updated_at à tabela users

-- Adicionar is_admin
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hapvida_status' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_admin';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0', 'SELECT "Column is_admin already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar is_active
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hapvida_status' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT "Column is_active already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar must_change_password
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hapvida_status' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'must_change_password';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0', 'SELECT "Column must_change_password already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar updated_at
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hapvida_status' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at';
SET @sql = IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', 'SELECT "Column updated_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Garantir que o usuário admin especial tenha permissões corretas
UPDATE users 
SET is_admin = 1 
WHERE email = 'j.alexandre.castro@gmail.com';

-- Tornar o primeiro usuário admin se ainda não houver nenhum admin
UPDATE users u1
SET u1.is_admin = 1
WHERE u1.created_at = (SELECT MIN(u2.created_at) FROM (SELECT * FROM users) u2)
  AND (SELECT COUNT(*) FROM (SELECT * FROM users WHERE is_admin = 1) u3) = 0;
