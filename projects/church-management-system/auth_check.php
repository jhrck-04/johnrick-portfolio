<?php
/**
 * Authentication Check Script
 * Include this at the top of protected pages (dashboard, admin pages, etc.)
 * Usage: require_once '../auth_check.php';
 */

session_start();

// Check if user is authenticated
if (!isset($_SESSION['is_authenticated']) || $_SESSION['is_authenticated'] !== true) {
    // User is not logged in, redirect to login page
    header('Location: /index.html');
    exit;
}

// Check if session has expired (optional - 2 hours timeout)
$timeout_duration = 7200; // 2 hours in seconds
if (isset($_SESSION['login_time'])) {
    $elapsed_time = time() - $_SESSION['login_time'];
    if ($elapsed_time > $timeout_duration) {
        // Session expired
        session_unset();
        session_destroy();
        header('Location: /index.html?session=expired');
        exit;
    }
}

// Update last activity time
$_SESSION['last_activity'] = time();

// Optional: Check for specific role requirements
// Call this function in pages that require specific roles
function requireRole($required_role) {
    $user_role = $_SESSION['user_role'] ?? 'user';
    
    $role_hierarchy = [
        'user' => 1,
        'admin' => 2,
        'superadmin' => 3
    ];
    
    $user_level = $role_hierarchy[$user_role] ?? 0;
    $required_level = $role_hierarchy[$required_role] ?? 0;
    
    if ($user_level < $required_level) {
        header('Location: /dashboard/dashboard.html?error=unauthorized');
        exit;
    }
}

// Optional: Get current user data
function getCurrentUser() {
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'username' => $_SESSION['username'] ?? '',
        'email' => $_SESSION['email'] ?? '',
        'full_name' => $_SESSION['full_name'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'user'
    ];
}
?>