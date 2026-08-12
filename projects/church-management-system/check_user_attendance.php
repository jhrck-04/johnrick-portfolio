<?php
// check_user_attendance.php - Check which events the current user has attended
session_start();

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Check authentication - use user_id (consistent with other PHP files)
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Not authenticated',
        'attended_events' => []
    ]);
    exit;
}

try {
    require_once '../db_connection/church_connector.php';
    
    if (!isset($pdo)) {
        throw new Exception('Database connection failed');
    }
    
    // Get current user's ID from session
    $currentUserId = $_SESSION['user_id'] ?? null;
    
    if (!$currentUserId) {
        echo json_encode([
            'success' => false,
            'message' => 'User ID not found in session',
            'attended_events' => []
        ]);
        exit;
    }
    
    // Get all event IDs that this user has attended
    $sql = "SELECT DISTINCT event_id 
            FROM event_participants 
            WHERE user_id = :user_id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':user_id' => $currentUserId]);
    
    $attendedEvents = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'attended_events' => $attendedEvents,
        'user_id' => $currentUserId
    ]);
    
} catch (PDOException $e) {
    error_log("Check Attendance DB Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error',
        'attended_events' => []
    ]);
} catch (Exception $e) {
    error_log("Check Attendance Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'attended_events' => []
    ]);
}
?>