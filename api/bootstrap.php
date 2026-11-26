<?php
declare(strict_types=1);

/*
 * Bharat Unfolded Premium Trip Planner
 * Server-only bootstrap. Never commit api/config.local.php.
 */
function premium_config(): array {
    $local = __DIR__ . '/config.local.php';
    if (!is_file($local)) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Payment service is not configured yet.']);
        exit;
    }
    $config = require $local;
    foreach (['key_id', 'key_secret', 'webhook_secret', 'base_url'] as $key) {
        if (empty($config[$key]) || str_contains((string)$config[$key], 'REPLACE_')) {
            http_response_code(503);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'error' => 'Payment service configuration is incomplete.']);
            exit;
        }
    }
    return $config;
}

function premium_db(): PDO {
    $dir = dirname(__DIR__) . '/storage';
    if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
        throw new RuntimeException('Could not create private storage directory.');
    }
    $db = new PDO('sqlite:' . $dir . '/premium.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $db->exec("CREATE TABLE IF NOT EXISTS premium_payments (
        reference_id TEXT PRIMARY KEY,
        payment_link_id TEXT UNIQUE,
        session_hash TEXT NOT NULL,
        amount INTEGER NOT NULL DEFAULT 500,
        status TEXT NOT NULL DEFAULT 'created',
        created_at INTEGER NOT NULL,
        paid_at INTEGER
    )");
    return $db;
}

function premium_json(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function premium_start_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function premium_session_hash(): string {
    premium_start_session();
    return hash('sha256', session_id());
}
