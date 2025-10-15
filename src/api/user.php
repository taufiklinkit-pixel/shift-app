<?php
require_once '../config.php';

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    http_response_code(401);
    exit;
}

$my_username = $_SESSION['username'];

// GET: Fetch all messages
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Dummy data for testing
    $messages = [
        ['username' => 'Alice', 'message' => "Morning shift complete.\n- Machine A serviced\n- Generator fuel at 80%", 'icon' => 'done', 'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours'))],
        ['username' => 'Bob', 'message' => "⚠️ Warning: Conveyor belt making noise. Reported to maintenance.", 'icon' => 'warning', 'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))],
        ['username' => $my_username, 'message' => "Starting night shift. All systems operational.", 'icon' => 'note', 'created_at' => date('Y-m-d H:i:s')]
    ];
    echo json_encode($messages);
    exit;
}

// POST: Create message
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $message = trim($input['message'] ?? '');
    $icon = $input['icon'] ?? 'note';
    
    if (!$message) {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit;
    }
    
    // In real app, save to database
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>