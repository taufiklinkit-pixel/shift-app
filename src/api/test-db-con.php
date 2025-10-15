<?php
session_start();

function getDbConnection($maxRetries = 5) {
    $host = 'db';
    $dbname = 'shift_handover';
    $db_user = 'root';              // ← Use root user
    $db_pass = '';                  // ← Empty password
    
    for ($i = 0; $i < $maxRetries; $i++) {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]);
            return $pdo;
        } catch (PDOException $e) {
            if ($i === $maxRetries - 1) throw $e;
            sleep(2);
        }
    }
}

// Rest of your login code...
?>