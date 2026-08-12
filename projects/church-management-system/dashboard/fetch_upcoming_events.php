<?php
/**
 * Fetch Upcoming Events for Dashboard
 * Returns the next 3 upcoming events that are not finished
 */

// Disable error display
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set JSON header
header('Content-Type: application/json');

// Enable CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    // Include database connection
    require_once '../db_connection/church_connector.php';
    
    // Check if database connection exists
    if (!isset($pdo)) {
        throw new Exception('Database connection failed');
    }
    
    // Prepare SQL query to fetch upcoming events (next 3 events that haven't happened)
    $sql = "SELECT 
                id,
                event_date,
                event_title,
                event_time,
                location,
                event_type,
                attendees,
                created_by,
                created_at
            FROM calendar_events 
            WHERE event_date >= CURDATE() 
            AND is_finished = 0
            ORDER BY event_date ASC, event_time ASC
            LIMIT 3";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    // Fetch all upcoming events
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the events for better frontend consumption
    $formattedEvents = [];
    foreach ($events as $event) {
        // Parse the date
        $dateObj = new DateTime($event['event_date']);
        
        // Get month abbreviation
        $month = strtoupper($dateObj->format('M'));
        
        // Get day
        $day = $dateObj->format('d');
        
        $formattedEvents[] = [
            'id' => $event['id'],
            'title' => $event['event_title'],
            'date' => $event['event_date'],
            'time' => $event['event_time'],
            'location' => $event['location'],
            'type' => $event['event_type'],
            'attendees' => $event['attendees'],
            'month' => $month,
            'day' => $day,
            'created_by' => $event['created_by'],
            'created_at' => $event['created_at']
        ];
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'count' => count($formattedEvents),
        'events' => $formattedEvents,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    // Log error to PHP error log
    error_log("Database error in fetch_upcoming_events.php: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred',
        'events' => []
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // Log error to PHP error log
    error_log("Error in fetch_upcoming_events.php: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while fetching events',
        'events' => []
    ], JSON_UNESCAPED_UNICODE);
}