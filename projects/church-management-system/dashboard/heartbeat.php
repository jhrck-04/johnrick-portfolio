<?php
error_reporting(0);
ini_set('display_errors', 0);
session_start();

require_once '../db_connection/church_connector.php';

header('Content-Type: application/json');

try {
    // Check if user is authenticated
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_authenticated'])) {
        echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
        exit;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Update last_seen timestamp
    $stmt = $pdo->prepare("
        UPDATE church_users 
        SET last_seen = NOW() 
        WHERE id = :user_id
    ");
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Heartbeat recorded',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("Heartbeat error: " . $e->getMessage());
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to record heartbeat'
    ]);
}
?>