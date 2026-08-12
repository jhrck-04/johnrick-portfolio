<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set JSON header
header('Content-Type: application/json');

// Database configuration
$host = 'localhost';
$dbname = 'church_management';
$username = 'your_db_username';
$password = 'your_db_password';

try {
    // Create database connection
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get POST data
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $account_number = isset($_POST['unique_id']) ? trim($_POST['unique_id']) : '';
    
    // Validate that at least one search parameter is provided
    if (empty($email) && empty($account_number)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Please provide either email or account number.'
        ]);
        exit;
    }
    
    // Build query based on provided parameters
    if (!empty($email) && !empty($account_number)) {
        // Both provided - search with OR condition
        $sql = "SELECT id, username, email, first_name, account_number FROM church_users WHERE email = :email OR account_number = :account_number LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':account_number', $account_number);
    } elseif (!empty($email)) {
        // Only email provided
        $sql = "SELECT id, username, email, first_name, account_number FROM church_users WHERE email = :email LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':email', $email);
    } else {
        // Only account_number provided
        $sql = "SELECT id, username, email, first_name, account_number FROM church_users WHERE account_number = :account_number LIMIT 1";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':account_number', $account_number);
    }
    
    // Execute query
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        // Account found
        echo json_encode([
            'status' => 'success',
            'message' => 'Account found successfully.',
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'name' => $user['first_name'],
            'unique_id' => $user['account_number']
        ]);
    } else {
        // No account found
        echo json_encode([
            'status' => 'error',
            'message' => 'No account found with the provided information. Please check your email or account number and try again.'
        ]);
    }
    
} catch(PDOException $e) {
    // Database error
    error_log("Database error in search_account.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'A system error occurred. Please try again later.'
    ]);
}

// Close connection
$conn = null;
?>