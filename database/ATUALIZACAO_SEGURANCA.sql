USE bitcups;

-- Limites de autenticação persistentes (não armazenam IP/e-mail em texto puro).
CREATE TABLE IF NOT EXISTS auth_rate_limits (
 limit_key CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
 attempts INT UNSIGNED NOT NULL DEFAULT 0,
 window_started_at DATETIME NOT NULL,
 INDEX idx_auth_rate_window (window_started_at)
) ENGINE=InnoDB;
