CREATE TABLE users (
  id char(36) NOT NULL,
  user_name varchar(64) NOT NULL,
  email varchar(254) NOT NULL,
  home_page varchar(2048) NULL,
  ip_address varchar(45) NULL,
  user_agent varchar(512) NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_users_user_name (user_name),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE comments (
  id char(36) NOT NULL,
  parent_id char(36) NULL,
  user_id char(36) NOT NULL,
  sanitized_html text NOT NULL,
  plain_text text NOT NULL,
  depth int NOT NULL DEFAULT 0,
  materialized_path varchar(2048) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'published',
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_comments_parent_created (parent_id, created_at),
  INDEX idx_comments_created (created_at),
  INDEX idx_comments_path (materialized_path(255)),
  INDEX idx_comments_status_created (status, created_at),
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE attachments (
  id char(36) NOT NULL,
  comment_id char(36) NOT NULL,
  file_kind varchar(16) NOT NULL,
  original_name varchar(255) NOT NULL,
  storage_key varchar(512) NOT NULL,
  mime_type varchar(128) NOT NULL,
  size_bytes int NOT NULL,
  width int NULL,
  height int NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE INDEX uq_attachments_storage_key (storage_key),
  INDEX idx_attachments_comment (comment_id),
  CONSTRAINT fk_attachments_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE captcha_challenges (
  id char(36) NOT NULL,
  challenge_hash varchar(255) NOT NULL,
  ip_address varchar(45) NULL,
  user_agent varchar(512) NULL,
  expires_at datetime(6) NOT NULL,
  consumed_at datetime(6) NULL,
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_captcha_expires (expires_at),
  INDEX idx_captcha_consumed (consumed_at)
) ENGINE=InnoDB;

CREATE TABLE auth_users (
  id char(36) NOT NULL,
  email varchar(254) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(32) NOT NULL DEFAULT 'admin',
  created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE INDEX uq_auth_users_email (email)
) ENGINE=InnoDB;
