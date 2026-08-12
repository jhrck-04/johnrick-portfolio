<?php
// fetch_events.php - Fetch events from calendar_events table

// Set JSON header FIRST
header('Content-Type: application/json');

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Include database connection (this creates $pdo variable)
    require_once '../db_connection/church_connector.php';
    
    // Check if $pdo exists
    if (!isset($pdo)) {
        throw new Exception('Database connection failed - $pdo variable not found');
    }
    
    // Prepare SQL query to fetch all events WITH creator names
$sql = "SELECT 
            ce.id,
            ce.event_date,
            ce.event_title,
            ce.event_time,
            ce.location,
            ce.event_type,
            ce.attendees,
            ce.created_by,
            ce.created_at,
            ce.is_finished,
            ce.finished_at,
            ce.finished_by,
            CONCAT(cu.first_name, ' ', cu.last_name) as creator_name
        FROM calendar_events ce
        LEFT JOIN church_users cu ON ce.created_by = cu.username
        ORDER BY ce.event_date ASC, ce.event_time ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    // Fetch all events
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'events' => $events,
        'count' => count($events)
    ]);
    
} catch (PDOException $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'events' => []
    ]);
} catch (Exception $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'events' => []
    ]);
}
?>