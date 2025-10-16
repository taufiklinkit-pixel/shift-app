<?php
require_once '../config.php';
header('Content-Type: application/json');

// Accepts: username, email, password
$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$email = trim($input['email'] ?? '');
$password = (string)($input['password'] ?? '');

if ($username === '' || $password === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Username, email, and password required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

try {
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password_hash, is_approved) VALUES (?, ?, ?, 0)');
    $stmt->execute([$username, $email, $hash]);
    echo json_encode(['success' => true, 'pending' => true]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] ?? null) {
        $code = (int)$e->errorInfo[1];
        if ($code === 1062) {
            http_response_code(409);
            echo json_encode(['error' => 'Username or email already registered']);
            exit;
        }
    }
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?>


