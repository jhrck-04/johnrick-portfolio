<?php
// CRITICAL: No whitespace before this tag!
// Start output buffering
ob_start();

// church_connector.php will handle session_start()
require_once '../db_connection/church_connector.php';

// Disable error display
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Set JSON header FIRST
header('Content-Type: application/json');

// Function to send clean JSON response
function sendResponse($status, $message = '', $data = null) {
    // Clear any output buffer
    ob_end_clean();
    
    $response = [
        'status' => $status,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    
    echo json_encode($response);
    exit;
}

// ✅ FIX: Check for user_id instead of is_authenticated
if (!isset($_SESSION['user_id'])) {
    sendResponse('failed', 'Authentication required');
}

// Get user info from session
$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['user_role'] ?? 'user';

// 🔥 NEW: Better user name handling
$user_name = $_SESSION['full_name'] ?? 
             $_SESSION['user_name'] ?? 
             $_SESSION['username'] ?? 
             'Unknown User';
$user_name = trim($user_name);

if (!isset($pdo)) {
    sendResponse('failed', 'Database connection failed');
}

try {
    // Handle GET - Load events
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'load') {
        $stmt = $pdo->prepare("
            SELECT 
                id, 
                event_date, 
                event_title, 
                event_time, 
                location, 
                event_type, 
                attendees, 
                created_by, 
                created_at,
                is_finished,
                finished_at,
                finished_by
            FROM calendar_events
            ORDER BY event_date ASC, event_time ASC
        ");
        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendResponse('success', 'Events loaded', ['events' => $events]);
    }

    // Handle POST - Add or Delete
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        // ADD EVENT
        if ($action === 'add') {
            $eventDate = trim($_POST['event_date'] ?? '');
            $eventTitle = trim($_POST['event_title'] ?? '');
            $eventTime = trim($_POST['event_time'] ?? '');
            $location = trim($_POST['location'] ?? '');
            $eventType = trim($_POST['event_type'] ?? '');
            $attendees = intval($_POST['attendees'] ?? 0);
            
            // Validate required fields
            if (empty($eventDate) || empty($eventTitle) || empty($eventTime) || empty($location) || empty($eventType)) {
                sendResponse('failed', 'All fields except attendees are required');
            }

            // ✅ NEW: Get user's full name from database
$stmt = $pdo->prepare("
    SELECT TRIM(CONCAT(
        first_name, 
        ' ', 
        IFNULL(NULLIF(middle_name, ''), ''),
        ' ',
        last_name
    )) as full_name
    FROM church_users 
    WHERE id = :user_id
    LIMIT 1
");
$stmt->execute([':user_id' => $user_id]);
$userInfo = $stmt->fetch(PDO::FETCH_ASSOC);

// Use database name if available, otherwise fallback to session
$createdBy = $userInfo['full_name'] ?? $user_name;

// Clean up extra spaces
$createdBy = trim(preg_replace('/\s+/', ' ', $createdBy));
            
            // Insert into database with user info from DATABASE (not session!)
$stmt = $pdo->prepare("
    INSERT INTO calendar_events 
    (event_date, event_title, event_time, location, event_type, attendees, created_by, created_at)
    VALUES 
    (:event_date, :event_title, :event_time, :location, :event_type, :attendees, :created_by, NOW())
");

$success = $stmt->execute([
    ':event_date' => $eventDate,
    ':event_title' => $eventTitle,
    ':event_time' => $eventTime,
    ':location' => $location,
    ':event_type' => $eventType,
    ':attendees' => $attendees,
    ':created_by' => $createdBy  // ✅ CHANGED FROM $user_name
]);
            
            if ($success) {
                sendResponse('success', 'Event added successfully', ['event_id' => $pdo->lastInsertId()]);
            } else {
                sendResponse('failed', 'Failed to add event');
            }
        }
        
        // DELETE EVENT
        if ($action === 'delete') {
            $eventId = intval($_POST['event_id'] ?? 0);
            
            if ($eventId <= 0) {
                sendResponse('failed', 'Invalid event ID');
            }
            
            // Check permission
            if ($user_role !== 'admin' && $user_role !== 'superadmin') {
                sendResponse('failed', 'You do not have permission to delete events');
            }
            
            $stmt = $pdo->prepare("DELETE FROM calendar_events WHERE id = :id");
            $success = $stmt->execute([':id' => $eventId]);
            
            if ($success && $stmt->rowCount() > 0) {
                sendResponse('success', 'Event deleted successfully');
            } else {
                sendResponse('failed', 'Event not found or already deleted');
            }
        }

        // MARK EVENT AS FINISHED
        if ($action === 'mark_finished') {
            $eventId = intval($_POST['event_id'] ?? 0);
            
            if ($eventId <= 0) {
                sendResponse('failed', 'Invalid event ID');
            }
            
            // Check permission
            if ($user_role !== 'admin' && $user_role !== 'superadmin') {
                sendResponse('failed', 'You do not have permission to mark events as finished');
            }
            
            // Check if event is already finished
            $stmt = $pdo->prepare("SELECT is_finished FROM calendar_events WHERE id = :id");
            $stmt->execute([':id' => $eventId]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$event) {
                sendResponse('failed', 'Event not found');
            }
            
            if ($event['is_finished'] == 1) {
                sendResponse('failed', 'This event is already marked as finished');
            }
            
            // 🔥 NEW: Get user's full name from database
            $stmt = $pdo->prepare("
                SELECT TRIM(CONCAT(
    first_name, 
    ' ', 
    IFNULL(NULLIF(middle_name, ''), ''),
    ' ',
    last_name
)) as full_name
                FROM church_users 
                WHERE id = :user_id
                LIMIT 1
            ");
            $stmt->execute([':user_id' => $user_id]);
            $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Use database name if available, otherwise fallback to session
            $finishedBy = $userInfo['full_name'] ?? $user_name;
            
            // Clean up extra spaces
            $finishedBy = trim(preg_replace('/\s+/', ' ', $finishedBy));
            
            // Mark event as finished
            $stmt = $pdo->prepare("
                UPDATE calendar_events 
                SET is_finished = 1, 
                    finished_at = NOW(), 
                    finished_by = :finished_by
                WHERE id = :id
            ");
            
            $success = $stmt->execute([
                ':finished_by' => $finishedBy,
                ':id' => $eventId
            ]);
            
            if ($success) {
                sendResponse('success', 'Event marked as finished successfully');
            } else {
                sendResponse('failed', 'Failed to mark event as finished');
            }
        }
        
        sendResponse('failed', 'Invalid action');
    }

    sendResponse('failed', 'Invalid request method');
    
} catch (PDOException $e) {
    error_log("Calendar Events DB Error: " . $e->getMessage());
    sendResponse('failed', 'Database error occurred');
} catch (Exception $e) {
    error_log("Calendar Events Error: " . $e->getMessage());
    sendResponse('failed', 'An error occurred');
}

ob_end_flush();
?>