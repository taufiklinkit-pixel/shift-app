<?php
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$current = (string)($input['current_password'] ?? '');
$next = (string)($input['new_password'] ?? '');

if ($current === '' || $next === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Both current and new passwords are required']);
    exit;
}

if (strlen($next) < 8) {
    http_response_code(422);
    echo json_encode(['error' => 'New password must be at least 8 characters long']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$_SESSION['username']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($current, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    $newHash = password_hash($next, PASSWORD_BCRYPT);
    $update = $pdo->prepare('UPDATE users SET password_hash = ? WHERE username = ?');
    $update->execute([$newHash, $_SESSION['username']]);

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update password']);
}
?>
