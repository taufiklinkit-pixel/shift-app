<?php
require_once '../config.php';

session_destroy();
// Expire the session cookie on the client as well
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    // For PHP 7.3+, allow array options (PHP 8.2 is used here)
    setcookie(session_name(), '', [
        'expires'  => time() - 42000,
        'path'     => $params['path'] ?? '/',
        'domain'   => $params['domain'] ?? '',
        'secure'   => (bool)($params['secure'] ?? false),
        'httponly' => (bool)($params['httponly'] ?? true),
        'samesite' => $params['samesite'] ?? 'Lax',
    ]);
}
echo json_encode(['success' => true]);
?>
