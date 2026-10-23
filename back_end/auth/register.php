
<?php

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/Auth.php';

header('Content-Type: application/json; charset=utf-8');

// Send JSON response
function sendResponse(int $status, array $data): void
{
    http_response_code($status);

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Allow POST only
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');

    sendResponse(405, [
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

// Get form data
$fullName = trim($_POST['full_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirm_password'] ?? '';

// Validate full name
if ($fullName === '' || mb_strlen($fullName) > 100) {
    sendResponse(422, [
        'success' => false,
        'message' => 'Invalid full name'
    ]);
}

// Validate email
if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 100
) {
    sendResponse(422, [
        'success' => false,
        'message' => 'Invalid email address'
    ]);
}

// Validate phone
if (strlen($phone) > 20) {
    sendResponse(422, [
        'success' => false,
        'message' => 'Invalid phone number'
    ]);
}

// Validate password
if (strlen($password) < 8) {
    sendResponse(422, [
        'success' => false,
        'message' => 'Password must be at least 8 characters'
    ]);
}

// Confirm password
if ($password !== $confirmPassword) {
    sendResponse(422, [
        'success' => false,
        'message' => 'Passwords do not match'
    ]);
}

// Register user
try {
    $auth = new Auth($pdo);

    $auth->register(
        $fullName,
        $email,
        $phone === '' ? null : $phone,
        $password
    );

    sendResponse(201, [
        'success' => true,
        'message' => 'Account created successfully'
    ]);

} catch (PDOException $e) {

    if ($e->getCode() === '23000') {
        sendResponse(409, [
            'success' => false,
            'message' => 'Email already registered'
        ]);
    }

    error_log($e->getMessage());

    sendResponse(500, [
        'success' => false,
        'message' => 'Internal server error'
    ]);

} catch (Exception $e) {

    if ($e->getMessage() === 'Email already registered') {
        sendResponse(409, [
            'success' => false,
            'message' => 'Email already registered'
        ]);
    }

    error_log($e->getMessage());

    sendResponse(500, [
        'success' => false,
        'message' => 'Internal server error'
    ]);
}
