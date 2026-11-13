-- BitCups: esquema inicial MySQL 8+ (estrutura, ainda sem API integrada)
CREATE DATABASE IF NOT EXISTS bitcups CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bitcups;
CREATE TABLE IF NOT EXISTS users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(160) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(200) NOT NULL, description TEXT, price_cents INT UNSIGNED NOT NULL,
 category VARCHAR(120), image_path VARCHAR(500), active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NULL, guest_name VARCHAR(160), guest_phone VARCHAR(32),
 status ENUM('awaiting_confirmation','confirmed','in_production','completed','cancelled') NOT NULL DEFAULT 'awaiting_confirmation',
 total_cents INT UNSIGNED NOT NULL DEFAULT 0,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS order_items (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NULL,
 product_name VARCHAR(200) NOT NULL, quantity INT UNSIGNED NOT NULL,
 unit_price_cents INT UNSIGNED NOT NULL,
 CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
 CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS favorites (
 user_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY (user_id, product_id),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS cart_items (
 user_id BIGINT UNSIGNED NOT NULL, product_id BIGINT UNSIGNED NOT NULL,
 quantity INT UNSIGNED NOT NULL DEFAULT 1,
 PRIMARY KEY (user_id, product_id),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS projects (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 order_id BIGINT UNSIGNED NULL, user_id BIGINT UNSIGNED NULL,
 customer_name VARCHAR(160) NOT NULL, description TEXT,
 status ENUM('received','reviewing','approved','in_production','completed') NOT NULL DEFAULT 'received',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS project_files (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 project_id BIGINT UNSIGNED NOT NULL,
 stored_path VARCHAR(500) NOT NULL, original_name VARCHAR(255) NOT NULL,
 mime_type VARCHAR(100) NOT NULL, size_bytes BIGINT UNSIGNED NOT NULL,
 FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS site_banners (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(200), subtitle TEXT, image_path VARCHAR(500), target_url VARCHAR(500),
 sort_order INT NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS coupons (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(80) NOT NULL UNIQUE, discount_percent TINYINT UNSIGNED NOT NULL,
 active BOOLEAN NOT NULL DEFAULT TRUE,
 CONSTRAINT chk_coupon_discount CHECK (discount_percent BETWEEN 1 AND 100)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 expires_at DATETIME NOT NULL,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recuperação de senha: tokens são armazenados apenas como hash SHA-256
CREATE TABLE IF NOT EXISTS password_resets (
 token_hash CHAR(64) PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
 expires_at DATETIME NOT NULL, used_at DATETIME NULL,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_resets_user ON password_resets(user_id);


-- Etapa 5: IDs da vitrine original são textos, diferentes dos IDs numéricos do catálogo administrativo.
CREATE TABLE IF NOT EXISTS customer_cart (
 user_id BIGINT UNSIGNED NOT NULL,
 catalog_id VARCHAR(120) NOT NULL,
 quantity INT UNSIGNED NOT NULL,
 PRIMARY KEY (user_id,catalog_id),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS customer_favorites (
 user_id BIGINT UNSIGNED NOT NULL,
 catalog_id VARCHAR(120) NOT NULL,
 PRIMARY KEY (user_id,catalog_id),
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Limites de autenticação persistentes (não armazenam IP/e-mail em texto puro).
CREATE TABLE IF NOT EXISTS auth_rate_limits (
 limit_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 attempts INT UNSIGNED NOT NULL DEFAULT 0,
 window_started_at DATETIME NOT NULL,
 INDEX idx_auth_rate_window (window_started_at)
) ENGINE=InnoDB;

-- Execute uma única vez no MySQL Workbench conectado ao banco bitcups.

CREATE TABLE IF NOT EXISTS admin_recovery_audit (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 admin_user_id BIGINT UNSIGNED NULL,
 target_user_id BIGINT UNSIGNED NULL,
 action ENUM('issued') NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
 INDEX idx_admin_recovery_created (created_at)
) ENGINE=InnoDB;
