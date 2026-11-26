# Bharat Unfolded — ₹5 Premium Trip Planner setup

## Important hosting requirement
This integration requires PHP 8+, cURL, PDO SQLite and HTTPS. GitHub Pages does **not** execute PHP. The `api/` and `storage/` folders must be deployed to the PHP-enabled Hostinger document root for `https://vezorex.shop/api/...` to execute.

## Configure the live credentials on the PHP host
1. Upload the `api/` and `storage/` folders to the same document root as `trip-budget.html`.
2. Copy `api/config.example.php` to `api/config.local.php` on the server only.
3. Put the Razorpay Live Key ID and Live Key Secret into that local file. Do not put credentials in GitHub, HTML, JavaScript, screenshots or chat.
4. Generate a separate webhook secret and add it as `webhook_secret` in the same local file. Do not reuse the API Secret as the webhook secret.
5. Keep `base_url` set to `https://vezorex.shop`. Ensure the `storage/` directory is writable by PHP but not publicly accessible.

Example local config shape (replace values on the server, not in Git):
```php
<?php
return [
  'key_id' => 'rzp_live_...',
  'key_secret' => 'YOUR_LIVE_KEY_SECRET',
  'webhook_secret' => 'A_SEPARATE_RANDOM_WEBHOOK_SECRET',
  'base_url' => 'https://vezorex.shop',
];
```

## Razorpay Dashboard webhook
Create a webhook with URL:
`https://vezorex.shop/api/razorpay-webhook.php`

Subscribe to the event:
- `payment_link.paid`

Set the webhook secret to the same value used as `webhook_secret` in `api/config.local.php`.

## Payment flow
The browser calls `api/create-payment-link.php`. The PHP server creates a **unique ₹5 Payment Link per browser session**, with a random reference ID and callback URL. The webhook validates Razorpay's HMAC signature and checks the exact ₹5 INR amount, reference ID and Payment Link ID. The return handler independently fetches the link from Razorpay and validates the callback signature before marking the same browser session as paid. The browser asks `api/premium-status.php` for the verified entitlement.

This per-session link is deliberate: the previously supplied shared short link cannot securely tell which browser session paid, so it cannot safely unlock an individual visitor's calculator. The integration uses the same Razorpay account and creates a fresh ₹5 link through its API.

## Test before launch
Use Razorpay Test Mode credentials and a Test Mode webhook first. Confirm a successful ₹5 test payment unlocks only the paying browser session; a second browser/incognito session must remain locked. Then switch the server config and webhook to Live mode. Do not test the Live setup with real money until the Test Mode flow passes.
