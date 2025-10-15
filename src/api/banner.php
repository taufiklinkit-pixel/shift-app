<?php
// No auth required; returns JSON with banner image URL if present
$root = realpath(__DIR__ . '/../../uploads/banner');
$result = [ 'url' => null ];
if ($root && is_dir($root)) {
    $files = glob($root . '/*.jpg');
    if (!$files) { $files = glob($root . '/*.jpeg'); }
    if (!$files) { $files = glob($root . '/*.png'); }
    if ($files && count($files) > 0) {
        // Convert filesystem path to web path under /uploads/banner/
        $basename = basename($files[0]);
        $result['url'] = '/uploads/banner/' . $basename;
    }
}
header('Content-Type: application/json');
echo json_encode($result);
?>


