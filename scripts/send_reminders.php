<?php
declare(strict_types=1);

/**
 * Usage: php scripts/send_reminders.php
 *
 * Sends email reminders to approved users who have not submitted
 * their daily shift card.
 */

require_once __DIR__ . '/../src/config.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from the command line.\n");
    exit(1);
}

$baseUrl = getenv('SHIFT_APP_URL') ?: 'http://localhost:8000';
$fromEmail = getenv('SHIFT_APP_REMINDER_FROM') ?: 'no-reply@shift-app.local';
$fromName = getenv('SHIFT_APP_REMINDER_NAME') ?: 'Shift Handover Board';

$dateLabel = (new DateTimeImmutable('now'))->format('l, F j, Y');

try {
    $userStmt = $pdo->prepare(
        "SELECT username, email FROM users
         WHERE is_approved = 1 AND email IS NOT NULL AND email <> ''"
    );
    $userStmt->execute();
    $users = $userStmt->fetchAll();
} catch (PDOException $e) {
    fwrite(STDERR, "Failed to load users: {$e->getMessage()}\n");
    exit(1);
}

if (!$users) {
    echo "No users with email addresses found. Nothing to do.\n";
    exit(0);
}

$checkStmt = $pdo->prepare(
    "SELECT 1 FROM messages WHERE username = ? AND DATE(created_at) = CURDATE() LIMIT 1"
);

$sent = 0;
$skipped = 0;
$failures = 0;

foreach ($users as $user) {
    $username = $user['username'];
    $email = $user['email'];

    try {
        $checkStmt->execute([$username]);
        $hasMessage = (bool)$checkStmt->fetchColumn();
    } catch (PDOException $e) {
        fwrite(STDERR, "Failed to check messages for {$username}: {$e->getMessage()}\n");
        $failures++;
        continue;
    }

    if ($hasMessage) {
        $skipped++;
        continue;
    }

    $subject = "Reminder: submit today's shift card";
    $body = <<<BODY
Hi {$username},

This is a friendly reminder to log your shift card for {$dateLabel}.

You can add it here: {$baseUrl}

Thanks for keeping the team up to date!

- {$fromName}
BODY;

    $headers = [
        sprintf('From: %s <%s>', $fromName, $fromEmail),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];

    $sentOk = mail($email, $subject, $body, implode("\r\n", $headers));

    if ($sentOk) {
        $sent++;
        echo "Reminder sent to {$username} <{$email}>\n";
    } else {
        fwrite(STDERR, "Failed to send reminder to {$username} <{$email}>\n");
        $failures++;
    }
}

echo "Done. Sent: {$sent}, skipped (already submitted): {$skipped}, failures: {$failures}\n";
exit($failures > 0 ? 2 : 0);
