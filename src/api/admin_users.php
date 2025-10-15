<?php
require_once '../config.php';

// Only admin can manage users
if (!isset($_SESSION['username']) || $_SESSION['username'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

header('Content-Type: application/json');

// GET: list users (both approved and pending)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query('SELECT id, username, is_approved, avatar_url FROM users ORDER BY username ASC');
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch users']);
    }
    exit;
}

// Helper to read JSON body
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $_GET['action'] ?? $input['action'] ?? '';

// POST (default action create)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'delete') {
        $username = trim($input['username'] ?? '');
        if ($username === '' || strtolower($username) === 'admin') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid username']);
            exit;
        }
        try {
            $stmt = $pdo->prepare('DELETE FROM users WHERE username = ?');
            $stmt->execute([$username]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete user']);
        }
        exit;
    }

    if ($action === 'reset') {
        $username = trim($input['username'] ?? '');
        $password = (string)($input['password'] ?? '');
        if ($username === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Username and password required']);
            exit;
        }
        try {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE username = ?');
            $stmt->execute([$hash, $username]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to reset password']);
        }
        exit;
    }

    if ($action === 'approve') {
        $username = trim($input['username'] ?? '');
        if ($username === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Username required']);
            exit;
        }
        try {
            $stmt = $pdo->prepare('UPDATE users SET is_approved = 1 WHERE username = ?');
            $stmt->execute([$username]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to approve user']);
        }
        exit;
    }

    // default: create
    $username = trim($input['username'] ?? '');
    $password = (string)($input['password'] ?? '');
    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required']);
        exit;
    }
    if (strtolower($username) === 'admin') {
        http_response_code(400);
        echo json_encode(['error' => 'Admin user already exists']);
        exit;
    }
    try {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        $stmt->execute([$username, $hash]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create user']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>


