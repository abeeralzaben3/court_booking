
<?php

header('Content-Type: application/json; charset=utf-8');

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

require_once __DIR__ . '/../includes/session.php';

// User must be logged in
requireLogin();

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/Payment.php';

// Read JSON request body
$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON data'
    ]);
    exit;
}

// Validate input
$bookingId = filter_var(
    $data['booking_id'] ?? null,
    FILTER_VALIDATE_INT
);

$method = $data['method'] ?? null;

if (
    $bookingId === false ||
    $bookingId === null ||
    $bookingId <= 0 ||
    !is_string($method) ||
    !in_array($method, ['cash', 'card'], true)
) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid payment information'
    ]);
    exit;
}

try {
    // Get user ID from the session
    $userId = (int) $_SESSION['user_id'];

    $payment = new Payment($pdo);

    $paymentId = $payment->createPayment(
        $bookingId,
        $userId,
        $method
    );

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Payment record created successfully',
        'payment_id' => $paymentId,
        'status' => 'pending'
    ]);

} catch (InvalidArgumentException $e) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
