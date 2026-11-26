<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    premium_json(['ok' => false, 'error' => 'Method not allowed.'], 405);
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !hash_equals('https://vezorex.shop', rtrim($origin, '/'))) {
    premium_json(['ok' => false, 'error' => 'Invalid request origin.'], 403);
}

$config = premium_config();
$sessionHash = premium_session_hash();
$db = premium_db();

$referenceId = 'BU' . strtoupper(bin2hex(random_bytes(12)));
$now = time();
$db->prepare('INSERT INTO premium_payments (reference_id, session_hash, amount, status, created_at) VALUES (?, ?, 500, ?, ?)')
   ->execute([$referenceId, $sessionHash, 'creating', $now]);

$payload = [
    'amount' => 500,
    'currency' => 'INR',
    'accept_partial' => false,
    'reference_id' => $referenceId,
    'description' => 'Bharat Unfolded Premium Trip Planner access',
    'expire_by' => $now + 900,
    'notify' => ['sms' => false, 'email' => false],
    'reminder_enable' => false,
    'callback_url' => rtrim($config['base_url'], '/') . '/api/payment-return.php',
    'callback_method' => 'get',
    'notes' => ['product' => 'premium_trip_planner', 'site' => 'Bharat Unfolded'],
];

$ch = curl_init('https://api.razorpay.com/v1/payment_links');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $config['key_id'] . ':' . $config['key_secret'],
    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 25,
]);
$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode < 200 || $httpCode >= 300) {
    $db->prepare("UPDATE premium_payments SET status='error' WHERE reference_id=?")->execute([$referenceId]);
    error_log('Razorpay Payment Link creation failed: HTTP ' . $httpCode . ' ' . $curlError);
    premium_json(['ok' => false, 'error' => 'Could not start payment. Please try again.'], 502);
}
$data = json_decode($response, true);
if (!is_array($data) || empty($data['id']) || empty($data['short_url'])) {
    $db->prepare("UPDATE premium_payments SET status='error' WHERE reference_id=?")->execute([$referenceId]);
    premium_json(['ok' => false, 'error' => 'Payment provider returned an invalid response.'], 502);
}
$db->prepare("UPDATE premium_payments SET payment_link_id=?, status='created' WHERE reference_id=?")
   ->execute([$data['id'], $referenceId]);

premium_json(['ok' => true, 'payment_url' => $data['short_url']]);
