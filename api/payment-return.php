<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$config = premium_config();
premium_start_session();
$linkId = (string)($_GET['razorpay_payment_link_id'] ?? '');
$referenceId = (string)($_GET['razorpay_payment_link_reference_id'] ?? '');
$status = (string)($_GET['razorpay_payment_link_status'] ?? '');
$paymentId = (string)($_GET['razorpay_payment_id'] ?? '');
$signature = (string)($_GET['razorpay_signature'] ?? '');
$base = rtrim($config['base_url'], '/');

if ($linkId === '' || $referenceId === '' || $paymentId === '' || $signature === '' || $status !== 'paid') {
    header('Location: ' . $base . '/trip-budget.html?payment=not-confirmed', true, 303);
    exit;
}
$message = $linkId . '|' . $referenceId . '|' . $status . '|' . $paymentId;
$expected = hash_hmac('sha256', $message, $config['key_secret']);
if (!hash_equals($expected, $signature)) {
    header('Location: ' . $base . '/trip-budget.html?payment=verification-failed', true, 303);
    exit;
}

/* Independently fetch the Payment Link from Razorpay before granting access. */
$ch = curl_init('https://api.razorpay.com/v1/payment_links/' . rawurlencode($linkId));
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $config['key_id'] . ':' . $config['key_secret'],
    CURLOPT_HTTPAUTH => CURLAUTH_BASIC,
    CURLOPT_TIMEOUT => 20,
]);
$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = is_string($response) ? json_decode($response, true) : null;

if ($httpCode < 200 || $httpCode >= 300 || !is_array($data) ||
    ($data['id'] ?? '') !== $linkId || ($data['reference_id'] ?? '') !== $referenceId ||
    ($data['status'] ?? '') !== 'paid' || (int)($data['amount'] ?? 0) !== 500 ||
    (int)($data['amount_paid'] ?? 0) !== 500 || ($data['currency'] ?? '') !== 'INR') {
    header('Location: ' . $base . '/trip-budget.html?payment=not-confirmed', true, 303);
    exit;
}

$db = premium_db();
$stmt = $db->prepare("UPDATE premium_payments SET status='paid', paid_at=? WHERE reference_id=? AND payment_link_id=? AND session_hash=? AND amount=500");
$stmt->execute([time(), $referenceId, $linkId, hash('sha256', session_id())]);
header('Location: ' . $base . '/trip-budget.html?payment=success', true, 303);
exit;
