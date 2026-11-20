-- Executar uma vez no MySQL antes do deploy desta versão.
CREATE TABLE IF NOT EXISTS order_customer_details (
  order_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  document_type ENUM('pf','pj') NOT NULL,
  document_number VARCHAR(14) NOT NULL,
  company_name VARCHAR(160) NOT NULL DEFAULT '',
  zip_code VARCHAR(9) NOT NULL,
  street VARCHAR(200) NOT NULL,
  street_number VARCHAR(20) NOT NULL,
  complement VARCHAR(120) NOT NULL DEFAULT '',
  neighborhood VARCHAR(120) NOT NULL,
  city VARCHAR(120) NOT NULL,
  state CHAR(2) NOT NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  CONSTRAINT fk_order_customer_details_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
