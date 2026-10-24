
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/Court.php';

// Allow GET requests only
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Validate court ID
$courtId = filter_input(
    INPUT_GET,
    'court_id',
    FILTER_VALIDATE_INT
);

if ($courtId === false || $courtId === null || $courtId <= 0) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Valid court_id is required'
    ]);
    exit;
}

try {
    $court = new Court($pdo);

    $courtDetails = $court->getCourtById((int) $courtId);

    if (!$courtDetails) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Court not found'
        ]);
        exit;
    }

    http_response_code(200);

    echo json_encode([
        'success' => true,
        'court' => $courtDetails
    ]);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Unable to retrieve court details'
    ]);
}
