<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

try {
    $hasAvatar = false;
    $hasApproved = false;
    $hasEmail = false;
    $checkUsers = $pdo->prepare(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
           AND COLUMN_NAME IN ('avatar_url','is_approved','email')"
    );
    $checkUsers->execute();
    foreach ($checkUsers->fetchAll() as $row) {
        if ($row['COLUMN_NAME'] === 'avatar_url') { $hasAvatar = true; }
        if ($row['COLUMN_NAME'] === 'is_approved') { $hasApproved = true; }
        if ($row['COLUMN_NAME'] === 'email') { $hasEmail = true; }
    }
    if (!$hasAvatar) {
        $pdo->exec("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL");
    }
    if (!$hasApproved) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_approved TINYINT(1) NOT NULL DEFAULT 0");
        // Approve existing admin user by default
        $pdo->exec("UPDATE users SET is_approved = 1 WHERE username = 'admin'");
    }
    $emailIndexExists = false;
    if (!$hasEmail) {
        $pdo->exec("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER username");
    }
    $indexCheck = $pdo->prepare(
        "SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'users_email_unique' LIMIT 1"
    );
    $indexCheck->execute();
    if (!$indexCheck->fetch()) {
        $pdo->exec("CREATE UNIQUE INDEX users_email_unique ON users (email)");
    }

    $hasEditCount = false;
    $hasUpdatedAt = false;
    $checkMessages = $pdo->prepare(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'messages'
           AND COLUMN_NAME IN ('edit_count','updated_at')"
    );
    $checkMessages->execute();
    foreach ($checkMessages->fetchAll() as $row) {
        if ($row['COLUMN_NAME'] === 'edit_count') { $hasEditCount = true; }
        if ($row['COLUMN_NAME'] === 'updated_at') { $hasUpdatedAt = true; }
    }
    if (!$hasEditCount) {
        $pdo->exec("ALTER TABLE messages ADD COLUMN edit_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER icon");
    }
    if (!$hasUpdatedAt) {
        $pdo->exec("ALTER TABLE messages ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
        $pdo->exec("UPDATE messages SET updated_at = created_at WHERE updated_at IS NULL");
    }
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Migration failed']);
}
?>


