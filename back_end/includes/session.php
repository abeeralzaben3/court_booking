
<?php

// Start the session only if it is not already active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Require an authenticated user
function requireLogin(): void
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);

        echo json_encode([
            'success' => false,
            'message' => 'Login required'
        ]);

        exit;
    }
}

// Require an authenticated admin
function requireAdmin(): void
{
    requireLogin();

    if (($_SESSION['role'] ?? null) !== 'admin') {
        http_response_code(403);

        echo json_encode([
            'success' => false,
            'message' => 'Admin access required'
        ]);

        exit;
    }
}
