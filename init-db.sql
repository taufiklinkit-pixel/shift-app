USE shift_handover;

CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(20) DEFAULT 'note',
    edit_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    is_approved TINYINT(1) NOT NULL DEFAULT 0
);

INSERT INTO users (username, password_hash, is_approved) VALUES 
('admin', '$2y$10$Y/4RhXLSCdkhPgufoIZgm.YkM3MmQfKzepDUmjwVRjx8wcwVXq1ku', 1)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    is_approved = VALUES(is_approved);
