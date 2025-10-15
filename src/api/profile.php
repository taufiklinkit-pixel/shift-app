<?php
require_once '../config.php';
header('Content-Type: application/json');

if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare('SELECT username, avatar_url FROM users WHERE username = ?');
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

    // JSON fallback: avatar_url direct set
    $input = json_decode(file_get_contents('php://input'), true);
    $avatarUrl = trim($input['avatar_url'] ?? '');
    try {
        $stmt = $pdo->prepare('UPDATE users SET avatar_url = ? WHERE username = ?');
        $stmt->execute([$avatarUrl ?: null, $_SESSION['username']]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update profile']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>


