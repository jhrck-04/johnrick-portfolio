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
    $user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    $new_password = isset($_POST['new_password']) ? $_POST['new_password'] : '';
    
    // Validate input
    if ($user_id <= 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid user ID.'
        ]);
        exit;
    }
    
    if (empty($new_password)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Password cannot be empty.'
        ]);
        exit;
    }
    
    if (strlen($new_password) < 6) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Password must be at least 6 characters long.'
        ]);
        exit;
    }
    
    // Hash the new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password in database
    $sql = "UPDATE church_users SET password = :password WHERE id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':password', $hashed_password);
    $stmt->bindParam(':user_id', $user_id);
    
    if ($stmt->execute()) {
        // Check if any row was actually updated
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'status' => 'success',
                'message' => 'Password has been reset successfully. You can now login with your new password.'
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'User not found or password unchanged.'
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update password. Please try again.'
        ]);
    }
    
} catch(PDOException $e) {
    // Database error
    error_log("Database error in reset_password.php: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'A system error occurred. Please try again later.'
    ]);
}

// Close connection
$conn = null;
?>