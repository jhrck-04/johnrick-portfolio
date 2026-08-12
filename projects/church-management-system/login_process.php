<?php
// Start output buffering to catch any unwanted output
ob_start();

session_start();

// Disable error display (errors will be logged instead)
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set content type for AJAX response
header('Content-Type: application/json');

// Function to send JSON response and exit
function sendResponse($status, $role = null, $name = null, $message = '', $userId = null, $email = null, $accountNumber = null) {
    // Clean any output buffer
    ob_clean();
    
    echo json_encode([
        'status' => $status,
        'role' => $role,
        'name' => $name,
        'message' => $message,
        'user_id' => $userId,
        'email' => $email,
        'account_number' => $accountNumber
    ]);
    exit;
}

// Check if request method is POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendResponse("failed", null, null, "Invalid request method");
}

// Get and sanitize input data
$username = trim($_POST['username'] ?? '');
$password = trim($_POST['password'] ?? '');

// Validate input
if (empty($username) || empty($password)) {
    sendResponse("failed", null, null, "Username and password are required");
}

try {
    // Include database connection
    require_once 'db_connection/church_connector.php';
    
    // Check if PDO connection exists
    if (!isset($pdo)) {
        sendResponse("failed", null, null, "Database connection failed");
    }
    
    // Query the church_users table for matching username
    // Updated to use separate name fields instead of full_name
    $stmt = $pdo->prepare("
        SELECT id, username, email, password, first_name, middle_name, last_name, role, status, account_number 
        FROM church_users 
        WHERE username = :username 
        AND status = 'active'
        LIMIT 1
    ");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->execute();

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        // Check if password is correct (support both hashed and plain text)
        $passwordCorrect = false;
        
        // First try hashed password verification
        if (password_verify($password, $user['password'])) {
            $passwordCorrect = true;
        } 
        // If that fails, try plain text comparison (for old accounts)
        elseif ($password === $user['password']) {
            $passwordCorrect = true;
            
            // Optional: Update to hashed password for security
            try {
                $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                $updatePassStmt = $pdo->prepare("UPDATE church_users SET password = :password WHERE id = :id");
                $updatePassStmt->execute([':password' => $hashedPassword, ':id' => $user['id']]);
            } catch (PDOException $e) {
                error_log("Failed to update password hash: " . $e->getMessage());
            }
        }
        
        if ($passwordCorrect) {
            // Password correct
            
            // Construct full name from separate fields
            $fullName = trim(
                $user['first_name'] . 
                ($user['middle_name'] ? ' ' . $user['middle_name'] : '') . 
                ' ' . $user['last_name']
            );
            
            // Set session variables
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['middle_name'] = $user['middle_name'];
            $_SESSION['last_name'] = $user['last_name'];
            $_SESSION['full_name'] = $fullName; // Constructed from parts
            $_SESSION['user_role'] = $user['role'];
            $_SESSION['account_number'] = $user['account_number'];
            $_SESSION['login_time'] = time();
            $_SESSION['is_authenticated'] = true;

            // Also set churchUser session in JSON format for calendar events
            $_SESSION['churchUser'] = json_encode([
                'user_id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'middle_name' => $user['middle_name'],
                'last_name' => $user['last_name'],
                'full_name' => $fullName,
                'role' => $user['role'],
                'account_number' => $user['account_number']
            ]);
            
            // Update last login timestamp
            try {
                $updateStmt = $pdo->prepare("UPDATE church_users SET last_login = NOW() WHERE id = :id");
                $updateStmt->bindParam(':id', $user['id'], PDO::PARAM_INT);
                $updateStmt->execute();
            } catch (PDOException $e) {
                error_log("Failed to update last login: " . $e->getMessage());
            }
            
            sendResponse(
                "success", 
                $user['role'], 
                $fullName, // Send constructed full name
                "Login successful",
                $user['id'],
                $user['email'],
                $user['account_number']
            );
        } else {
            sendResponse("failed", null, null, "Invalid password");
        }
    } else {
        sendResponse("failed", null, null, "Username not found or account is inactive");
    }
    
} catch (PDOException $e) {
    error_log("Database error in login_process.php: " . $e->getMessage());
    sendResponse("failed", null, null, "Database connection error");
} catch (Exception $e) {
    error_log("General error in login_process.php: " . $e->getMessage());
    sendResponse("failed", null, null, "System error occurred");
}

// Clean output buffer and exit
ob_end_flush();
?>