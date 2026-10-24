
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/Booking.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

$courtId = filter_input(
    INPUT_GET,
    'court_id',
    FILTER_VALIDATE_INT
);

$date = $_GET['date'] ?? '';

if (!$courtId || !is_string($date)) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Valid court_id and date are required'
    ]);
    exit;
}

try {
    $booking = new Booking($pdo);

    $bookedSlots = $booking->getBookedSlots(
        (int) $courtId,
        $date
    );

    echo json_encode([
        'success' => true,
        'court_id' => (int) $courtId,
        'date' => $date,
        'booked_slots' => $bookedSlots
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
        'message' => 'Unable to retrieve booked slots'
    ]);
}
