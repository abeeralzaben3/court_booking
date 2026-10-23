
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/Booking.php';

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

// User must be logged in
requireLogin();

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
$courtId = filter_var(
    $data['court_id'] ?? null,
    FILTER_VALIDATE_INT
);

$date = $data['booking_date'] ?? null;
$startTime = $data['start_time'] ?? null;
$endTime = $data['end_time'] ?? null;

if (
    $courtId === false ||
    $courtId === null ||
    $courtId <= 0 ||
    !is_string($date) ||
    !is_string($startTime) ||
    !is_string($endTime) ||
    trim($date) === '' ||
    trim($startTime) === '' ||
    trim($endTime) === ''
) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid booking information'
    ]);
    exit;
}

try {
    $userId = (int) $_SESSION['user_id'];

    $booking = new Booking($pdo);

    $bookingId = $booking->createBooking(
        $userId,
        $courtId,
        trim($date),
        trim($startTime),
        trim($endTime)
    );

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Booking created successfully',
        'booking_id' => $bookingId
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
