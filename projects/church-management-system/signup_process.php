<?php
session_start();
header('Content-Type: application/json');

// Enable error logging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Include database connection
require_once 'db_connection/church_connector.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input data']);
    exit;
}

$username = trim($input['username'] ?? '');
$firstname = trim($input['firstname'] ?? '');
$middlename = trim($input['middlename'] ?? '');
$lastname = trim($input['lastname'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$confirmpassword = $input['confirmpassword'] ?? '';

// Server-side validation
if (strlen($username) < 4) {
    echo json_encode(['success' => false, 'message' => 'Username must be at least 4 characters long']);
    exit;
}

if (strlen($firstname) < 2) {
    echo json_encode(['success' => false, 'message' => 'First name is required']);
    exit;
}

if (strlen($lastname) < 2) {
    echo json_encode(['success' => false, 'message' => 'Last name is required']);
    exit;
}

// Validate email
$emailRegex = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/';
if (!preg_match($emailRegex, $email)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address']);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long']);
    exit;
}

if ($password !== $confirmpassword) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
    exit;
}

try {
    // Check if PDO connection exists
    if (!isset($pdo)) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Start transaction for safety
    $pdo->beginTransaction();
    
    // Check if username already exists
    $stmt = $pdo->prepare("SELECT id FROM church_users WHERE username = ?");
    $stmt->execute([$username]);
    
    if ($stmt->fetch()) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Username already exists. Please choose a different username.']);
        exit;
    }
    
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM church_users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Email already exists. Please use a different email.']);
        exit;
    }
    
    // Get the highest existing account number to generate next one
    $stmt = $pdo->query("SELECT account_number FROM church_users WHERE account_number IS NOT NULL ORDER BY CAST(account_number AS UNSIGNED) DESC LIMIT 1");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Generate next account number
    if ($result && !empty($result['account_number'])) {
        $lastAccountNumber = intval($result['account_number']);
        $nextAccountNumber = $lastAccountNumber + 1;
    } else {
        // Start from 1111 if no accounts exist
        $nextAccountNumber = 1111;
    }
    
    // Convert to string for varchar field
    $accountNumberStr = strval($nextAccountNumber);
    
    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user with separate name fields only
    $stmt = $pdo->prepare("
        INSERT INTO church_users 
        (account_number, username, email, password, first_name, middle_name, last_name, role, status, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'user', 'active', NOW(), NOW())
    ");
    
    $success = $stmt->execute([
        $accountNumberStr, 
        $username, 
        $email, 
        $hashedPassword, 
        $firstname,
        $middlename ?: null, // Use NULL if middle name is empty
        $lastname
    ]);
    
    if ($success) {
        $pdo->commit();
        echo json_encode([
            'success' => true, 
            'message' => 'Account created successfully! Your account number is ' . $accountNumberStr,
            'account_number' => $accountNumberStr
        ]);
    } else {
        $pdo->rollBack();
        echo json_encode([
            'success' => false, 
            'message' => 'Failed to create account. Please try again.'
        ]);
    }
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Return detailed error for debugging
    echo json_encode([
        'success' => false, 
        'message' => 'Database error: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Return detailed error for debugging
    echo json_encode([
        'success' => false, 
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>