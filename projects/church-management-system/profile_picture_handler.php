<?php
require_once '../db_connection/church_connector.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit();
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit();
}

$userId = $_SESSION['user_id'];

// Get the JSON data
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!isset($data['profilePicture'])) {
    echo json_encode(['status' => 'error', 'message' => 'No profile picture data']);
    exit();
}

$base64Image = $data['profilePicture'];

// Validate base64 image
if (!preg_match('/^data:image\/(png|jpg|jpeg|gif);base64,/', $base64Image)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid image format']);
    exit();
}

try {
    // Update profile picture in database
    $stmt = $pdo->prepare("
        UPDATE church_users 
        SET profile_picture = :profile_picture,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :user_id
    ");
    
    $stmt->execute([
        ':profile_picture' => $base64Image,
        ':user_id' => $userId
    ]);
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile picture updated successfully',
        'profilePicture' => $base64Image
    ]);
    
} catch (PDOException $e) {
    error_log("Profile picture update error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Database error occurred']);
}