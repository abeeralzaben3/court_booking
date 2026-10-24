
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/Payment.php';

// Only POST requests are allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Only admins can confirm cash payments
requireLogin();
requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (
    !is_array($data) ||
    !isset($data['booking_id']) ||
    filter_var($data['booking_id'], FILTER_VALIDATE_INT) === false ||
    (int) $data['booking_id'] <= 0
) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Valid booking_id is required'
    ]);
    exit;
}

try {
    $payment = new Payment($pdo);

    $payment->confirmCashPayment(
        (int) $data['booking_id']
    );

    http_response_code(200);

    echo json_encode([
        'success' => true,
        'message' => 'Cash payment confirmed successfully'
    ]);

} catch (InvalidArgumentException $e) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to confirm payment'
    ]);
}
