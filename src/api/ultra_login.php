<?php
session_start();
$_SESSION['username'] = 'admin';
echo json_encode(['success' => true, 'username' => 'admin']);
?>