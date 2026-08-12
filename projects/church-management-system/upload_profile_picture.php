<?php
require_once '../db_connection/church_connector.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit();
}

$userId = $_SESSION['user_id'];

// Check if file was uploaded
if (!isset($_FILES['profilePicture']) || $_FILES['profilePicture']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded or upload error']);
    exit();
}

$file = $_FILES['profilePicture'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
$fileType = mime_content_type($file['tmp_name']);

if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed']);
    exit();
}

// Validate file size (2MB max)
if ($file['size'] > 2 * 1024 * 1024) {
    echo json_encode(['status' => 'error', 'message' => 'File too large. Maximum size is 2MB']);
    exit();
}

// Create Profile_pictures folder if it doesn't exist
$uploadDir = 'Profile_pictures/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$newFilename = 'user_' . $userId . '_' . time() . '.' . $extension;
$uploadPath = $uploadDir . $newFilename;

// Delete old profile picture if exists
try {
    $stmt = $pdo->prepare("SELECT profile_picture FROM church_users WHERE id = :user_id");
    $stmt->execute(['user_id' => $userId]);
    $oldPicture = $stmt->fetchColumn();
    
    if ($oldPicture && file_exists($oldPicture)) {
        unlink($oldPicture); // Delete old file
    }
} catch (PDOException $e) {
    error_log("Error checking old picture: " . $e->getMessage());
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    echo json_encode([
        'status' => 'success',
        'message' => 'Profile picture uploaded successfully',
        'filePath' => $uploadPath,
        'fileName' => $newFilename
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save uploaded file']);
}