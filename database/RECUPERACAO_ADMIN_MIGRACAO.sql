-- Execute uma única vez no MySQL Workbench conectado ao banco bitcups.
USE bitcups;
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
