
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/Booking.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

requireLogin();

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
    $booking = new Booking($pdo);

    $booking->cancelBooking(
        (int) $data['booking_id'],
        (int) $_SESSION['user_id']
    );

    echo json_encode([
        'success' => true,
        'message' => 'Booking cancelled successfully'
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
        'message' => 'Unable to cancel booking'
    ]);
}
