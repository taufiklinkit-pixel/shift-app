<?php
require_once '../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT username, email, avatar_url FROM users WHERE username = ?');
    $stmt->execute([$_SESSION['username']]);
    echo json_encode($stmt->fetch() ?: []);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Support multipart upload: field name 'avatar'
    if (isset($_FILES['avatar']) && is_uploaded_file($_FILES['avatar']['tmp_name'])) {
        // Save under web root /public/uploads/avatars (mapped to project public/public/uploads/avatars)
        $dir = __DIR__ . '/../../public/uploads/avatars';
        if (!is_dir($dir)) { mkdir($dir, 0777, true); }
        $ext = pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $safeUser = preg_replace('/[^a-zA-Z0-9_-]/', '_', $_SESSION['username']);
        $filename = $safeUser . '_' . time() . '.' . strtolower($ext);
        $dest = $dir . '/' . $filename;
        if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $dest)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save file']);
            exit;
        }
        // Public URL (served from /uploads/avatars/...)
        $publicUrl = '/uploads/avatars/' . $filename;
        try {
            $stmt = $pdo->prepare('UPDATE users SET avatar_url = ? WHERE username = ?');
            $stmt->execute([$publicUrl, $_SESSION['username']]);
            echo json_encode(['success' => true, 'avatar_url' => $publicUrl]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update profile']);
        }
        exit;
    }

    // JSON fallback: update email and/or avatar_url
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid payload']);
        exit;
    }

    $fields = [];
    $params = [];

    if (array_key_exists('email', $input)) {
        $email = trim((string)$input['email']);
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(['error' => 'Invalid email address']);
            exit;
        }
        $fields[] = 'email = ?';
        $params[] = $email;
    }

    if (array_key_exists('avatar_url', $input)) {
        $avatarUrl = trim((string)$input['avatar_url']);
        $fields[] = 'avatar_url = ?';
        $params[] = $avatarUrl !== '' ? $avatarUrl : null;
    }

    if (!$fields) {
        http_response_code(400);
        echo json_encode(['error' => 'Nothing to update']);
        exit;
    }

    $params[] = $_SESSION['username'];

    try {
        $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE username = ?');
        $stmt->execute($params);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        if (($e->errorInfo[1] ?? null) === 1062) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already in use']);
            exit;
        }
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>


