<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$MAX_EDITS = 3;
$my_username = $_SESSION['username'];

// GET: Fetch messages from database with pagination (default 5 rows x 3 cols = 15/page)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $pageSize = isset($_GET['pageSize']) ? max(1, (int)$_GET['pageSize']) : 15;

        // Total count
        $countStmt = $pdo->query("SELECT COUNT(*) AS c FROM messages");
        $total = (int)$countStmt->fetch()['c'];
        $totalPages = (int)ceil($total / $pageSize);
        if ($totalPages < 1) { $totalPages = 1; }

        $offset = ($page - 1) * $pageSize;
        $stmt = $pdo->prepare(
            "SELECT m.id,
                    m.username,
                    m.message,
                    m.icon,
                    m.created_at,
                    m.updated_at,
                    m.edit_count,
                    (DATE(m.created_at) = CURDATE()) AS is_today,
                    u.avatar_url
             FROM messages m
             LEFT JOIN users u ON u.username = m.username
             ORDER BY m.created_at DESC
             LIMIT :limit OFFSET :offset"
        );
        $stmt->bindValue(':limit', $pageSize, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $messages = $stmt->fetchAll();
        echo json_encode([ 'items' => $messages, 'page' => $page, 'pageSize' => $pageSize, 'total' => $total, 'totalPages' => $totalPages ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch messages']);
    }
    exit;
}

// DELETE: Remove a message (admin only)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_SESSION['username']) || $_SESSION['username'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
    // id can come from query string or JSON body
    $id = null;
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = (int)($input['id'] ?? 0);
    }
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid id']);
        exit;
    }
    try {
        $stmt = $pdo->prepare('DELETE FROM messages WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete message']);
    }
    exit;
}

// POST: Create message in database
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = trim($input['message'] ?? '');
    $icon = $input['icon'] ?? 'note';

    if (!$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit;
    }

    try {
        $existingStmt = $pdo->prepare(
            'SELECT id FROM messages WHERE username = ? AND DATE(created_at) = CURDATE() LIMIT 1'
        );
        $existingStmt->execute([$my_username]);
        $existing = $existingStmt->fetch();

        if ($existing) {
            http_response_code(409);
            echo json_encode(['error' => 'You already submitted a card today. Edit it or wait until tomorrow.']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO messages (username, message, icon, edit_count) VALUES (?, ?, ?, 0)");
        $stmt->execute([$my_username, $message, $icon]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save message']);
    }
    exit;
}

// PUT: Update existing message with limited edits
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = trim($input['message'] ?? '');
    $icon = $input['icon'] ?? 'note';

    if ($message === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit;
    }

    try {
        $stmt = $pdo->prepare(
            'SELECT id, edit_count FROM messages WHERE username = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 1'
        );
        $stmt->execute([$my_username]);
        $current = $stmt->fetch();

        if (!$current) {
            http_response_code(404);
            echo json_encode(['error' => 'You have no card today to update.']);
            exit;
        }

        if ((int)($current['edit_count'] ?? 0) >= $MAX_EDITS) {
            http_response_code(403);
            echo json_encode(['error' => 'Edit limit reached. You can only update your card three times.']);
            exit;
        }

        $update = $pdo->prepare('UPDATE messages SET message = ?, icon = ?, edit_count = edit_count + 1, updated_at = NOW() WHERE id = ?');
        $update->execute([$message, $icon, $current['id']]);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update message']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
