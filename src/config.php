<?php
// Session configuration (lifetime + cookie flags)
// Adjust lifetime as needed (seconds). Here: 1 day
$SESSION_LIFETIME = 86400; // 24 hours

// Increase server-side session GC lifetime to match cookie
ini_set('session.gc_maxlifetime', (string)$SESSION_LIFETIME);
ini_set('session.use_strict_mode', '1');
// Make GC runs less aggressive (1/1000 chance per request)
ini_set('session.gc_probability', '1');
ini_set('session.gc_divisor', '1000');

$sessionPath = __DIR__ . '/storage/sessions';
if (!is_dir($sessionPath)) {
    mkdir($sessionPath, 0777, true);
}
if (!is_writable($sessionPath)) {
    chmod($sessionPath, 0777);
}
ini_set('session.save_path', $sessionPath);

// Detect HTTPS behind proxies as well
$isSecure = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443) ||
    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https')
);

// Configure cookie parameters before starting session
if (PHP_SESSION_ACTIVE !== session_status()) {
    session_set_cookie_params([
        'lifetime' => $SESSION_LIFETIME,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isSecure,   // set true in HTTPS
        'httponly' => true,
        'samesite' => 'Lax',       // use 'None' (with HTTPS) if calling from another site
    ]);
    session_start();
}

// Database configuration for Docker
$host = 'db';
$dbname = 'shift_handover';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    die("Database connection failed");
}
?>
