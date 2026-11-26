<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

$config = premium_config();
$rawBody = file_get_contents('php://input') ?: '';
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';
if ($rawBody === '' || $signature === '') {
    http_response_code(400);
    exit('Missing webhook payload or signature.');
}
$expected = hash_hmac('sha256', $rawBody, $config['webhook_secret']);
if (!hash_equals($expected, $signature)) {
    http_response_code(400);
    exit('Invalid webhook signature.');
}

$event = json_decode($rawBody, true);
if (!is_array($event) || ($event['event'] ?? '') !== 'payment_link.paid') {
    http_response_code(200);
    exit('Event ignored.');
}
$link = $event['payload']['payment_link']['entity'] ?? [];
$referenceId = (string)($link['reference_id'] ?? '');
$linkId = (string)($link['id'] ?? '');
$amount = (int)($link['amount'] ?? 0);
$amountPaid = (int)($link['amount_paid'] ?? 0);
$status = (string)($link['status'] ?? '');

if ($referenceId === '' || $linkId === '' || $status !== 'paid' || $amount !== 500 || $amountPaid !== 500 || ($link['currency'] ?? '') !== 'INR') {
    http_response_code(200);
    exit('Payment does not match premium purchase.');
}
$db = premium_db();
$stmt = $db->prepare("UPDATE premium_payments SET status='paid', paid_at=? WHERE reference_id=? AND payment_link_id=? AND amount=500");
$stmt->execute([time(), $referenceId, $linkId]);
http_response_code(200);
echo 'OK';
