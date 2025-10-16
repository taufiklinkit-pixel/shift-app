<?php
require_once '../config.php';
header('Content-Type: application/json');

// Accepts: username, password
$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

try {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, is_approved) VALUES (?, ?, 0)');
    $stmt->execute([$username, $hash]);
    echo json_encode(['success' => true, 'pending' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?>


