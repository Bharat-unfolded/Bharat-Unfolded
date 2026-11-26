<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

premium_start_session();
$db = premium_db();
$stmt = $db->prepare("SELECT 1 FROM premium_payments WHERE session_hash=? AND status='paid' AND amount=500 LIMIT 1");
$stmt->execute([hash('sha256', session_id())]);
premium_json(['ok' => true, 'premium' => (bool)$stmt->fetchColumn()]);
