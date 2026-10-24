
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session.php';
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

// Only logged-in users can view their bookings
requireLogin();

try {
    $booking = new Booking($pdo);

    // Get the user ID from the session, not from the request
    $userId = (int) $_SESSION['user_id'];

    $bookings = $booking->getUserBookings($userId);

    http_response_code(200);

    echo json_encode([
        'success' => true,
        'count' => count($bookings),
        'bookings' => $bookings
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to retrieve bookings'
    ]);
}
