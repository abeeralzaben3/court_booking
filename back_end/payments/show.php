
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/Payment.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

requireLogin();

$bookingId = filter_input(
    INPUT_GET,
    'booking_id',
    FILTER_VALIDATE_INT
);

if (!$bookingId || $bookingId <= 0) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Valid booking_id is required'
    ]);
    exit;
}

try {
    $payment = new Payment($pdo);

    $paymentDetails = $payment->getPaymentByBookingId(
        (int) $bookingId,
        (int) $_SESSION['user_id']
    );

    if (!$paymentDetails) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Payment not found'
        ]);
        exit;
    }

    http_response_code(200);

    echo json_encode([
        'success' => true,
        'payment' => $paymentDetails
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
        'message' => 'Unable to retrieve payment'
    ]);
}
