<?php
require_once '../config.php';

header('Content-Type: application/json');

try {
    $hasAvatar = false;
    $hasApproved = false;
    $check = $pdo->prepare("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('avatar_url','is_approved')");
    $check->execute();
    foreach ($check->fetchAll() as $row) {
        if ($row['COLUMN_NAME'] === 'avatar_url') $hasAvatar = true;
        if ($row['COLUMN_NAME'] === 'is_approved') $hasApproved = true;
    }
    if (!$hasAvatar) {
        $pdo->exec("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) NULL");
    }
    if (!$hasApproved) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_approved TINYINT(1) NOT NULL DEFAULT 0");
        // Approve existing admin user by default
        $pdo->exec("UPDATE users SET is_approved = 1 WHERE username = 'admin'");
    }
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Migration failed']);
}
?>


