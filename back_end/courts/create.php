
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/Court.php';

// Allow POST requests only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Only admins can add courts
requireLogin();
requireAdmin();

// Read JSON request
$data = json_decode(file_get_contents('php://input'), true);

if (
    !is_array($data) ||
    !isset($data['name'], $data['sport'], $data['price_per_hour']) ||
    !is_string($data['name']) ||
    !is_string($data['sport']) ||
    !is_numeric($data['price_per_hour']) ||
    (isset($data['status']) && !is_string($data['status']))
) {
    http_response_code(422);

    echo json_encode([
        'success' => false,
        'message' => 'Invalid or missing court data'
    ]);
    exit;
}

$name = $data['name'];
$sport = $data['sport'];
$pricePerHour = (float) $data['price_per_hour'];
$status = $data['status'] ?? 'active';

try {
    $court = new Court($pdo);

    $courtId = $court->createCourt(
        $name,
        $sport,
        $pricePerHour,
        $status
    );

    http_response_code(201);

    echo json_encode([
        'success' => true,
        'message' => 'Court created successfully',
        'court_id' => $courtId
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
        'message' => 'Unable to create court'
    ]);
}
