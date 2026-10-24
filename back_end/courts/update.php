
<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/Court.php';

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
requireAdmin();

$data = json_decode(file_get_contents('php://input'), true);

if (!is_array($data) || !isset($data['court_id'])) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'court_id is required'
    ]);
    exit;
}

$courtId = filter_var(
    $data['court_id'],
    FILTER_VALIDATE_INT
);

if ($courtId === false || $courtId <= 0) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid court ID'
    ]);
    exit;
}

try {
    $court = new Court($pdo);

    // Status-only update
    if (
        array_key_exists('status', $data) &&
        !array_key_exists('name', $data) &&
        !array_key_exists('sport', $data) &&
        !array_key_exists('price_per_hour', $data)
    ) {
        if (!is_string($data['status'])) {
            throw new InvalidArgumentException(
                'Invalid court status'
            );
        }

        $court->updateCourtStatus(
            $courtId,
            $data['status']
        );

    } else {
        // Full court update
        if (
            !isset(
                $data['name'],
                $data['sport'],
                $data['price_per_hour'],
                $data['status']
            ) ||
            !is_string($data['name']) ||
            !is_string($data['sport']) ||
            !is_string($data['status']) ||
            !is_numeric($data['price_per_hour'])
        ) {
            throw new InvalidArgumentException(
                'Complete court data is required'
            );
        }

        $court->updateCourt(
            $courtId,
            $data['name'],
            $data['sport'],
            (float) $data['price_per_hour'],
            $data['status']
        );
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Court updated successfully',
        'court' => $court->getCourtById($courtId)
    ]);

} catch (InvalidArgumentException $e) {
    $notFound = $e->getMessage() === 'Court not found';

    http_response_code($notFound ? 404 : 422);

    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to update court'
    ]);
}
