
<?php

header('Content-Type: application/json; charset=utf-8');

// Connect to the database
require_once __DIR__ . '/../includes/db.php';

// Load the Court class
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

try {
    // Create an object from the Court class
    $court = new Court($pdo);

    // Get all courts from the database
    $courts = $court->getAllCourts();

    // Return courts as JSON
    http_response_code(200);

    echo json_encode([
        'success' => true,
        'courts' => $courts
    ]);

} catch (Throwable $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
