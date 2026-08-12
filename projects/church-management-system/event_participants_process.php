<?php
// CRITICAL: No whitespace before this tag!
ob_start();

session_start();

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

function sendResponse($status, $message = '', $data = null) {
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

// Check authentication
if (!isset($_SESSION['is_authenticated']) || $_SESSION['is_authenticated'] !== true) {
    sendResponse('failed', 'Authentication required');
}

// Include database connection
require_once '../db_connection/church_connector.php';

if (!isset($pdo)) {
    sendResponse('failed', 'Database connection failed');
}

try {
    // Handle POST - Add Participant to Event
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $action = $_POST['action'] ?? '';
        
        // ADD PARTICIPANT TO EVENT
if ($action === 'add_participant') {
    $eventId = intval($_POST['event_id'] ?? 0);
    $userId = intval($_POST['user_id'] ?? 0);
    $accountNumber = trim($_POST['account_number'] ?? '');
    
    // Validate required fields
    if ($eventId <= 0 || $userId <= 0 || empty($accountNumber)) {
        sendResponse('failed', 'Event ID, User ID, and Account Number are required');
    }
    
    // ✅ NEW: Check if event is finished
    $stmt = $pdo->prepare("SELECT is_finished FROM calendar_events WHERE id = :event_id");
    $stmt->execute([':event_id' => $eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$event) {
        sendResponse('failed', 'Event not found');
    }
    
    if ($event['is_finished'] == 1) {
        sendResponse('failed', 'This event has been marked as finished. You cannot add more participants.');
    }
    
    // Get username from session
    $addedBy = $_SESSION['username'] ?? $_SESSION['full_name'] ?? 'Unknown';
            
            // Get username from session
            $addedBy = $_SESSION['username'] ?? $_SESSION['full_name'] ?? 'Unknown';
            
            // Get participant name from church_users table
            $stmt = $pdo->prepare("
                SELECT CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) AS full_name
                FROM church_users 
                WHERE id = :user_id AND account_number = :account_number
                LIMIT 1
            ");
            $stmt->execute([
                ':user_id' => $userId,
                ':account_number' => $accountNumber
            ]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                sendResponse('failed', 'Participant not found');
            }
            
            $participantName = trim($user['full_name']);
            
            // Check if participant is already added to this event
            $stmt = $pdo->prepare("
                SELECT id FROM event_participants 
                WHERE event_id = :event_id AND user_id = :user_id
                LIMIT 1
            ");
            $stmt->execute([
                ':event_id' => $eventId,
                ':user_id' => $userId
            ]);
            
            if ($stmt->fetch()) {
                sendResponse('failed', 'This participant is already added to this event');
            }
            
            // Insert participant into event_participants table
            $stmt = $pdo->prepare("
                INSERT INTO event_participants 
                (event_id, user_id, account_number, participant_name, added_by, attended_at)
                VALUES 
                (:event_id, :user_id, :account_number, :participant_name, :added_by, NOW())
            ");
            
            $success = $stmt->execute([
                ':event_id' => $eventId,
                ':user_id' => $userId,
                ':account_number' => $accountNumber,
                ':participant_name' => $participantName,
                ':added_by' => $addedBy
            ]);
            
            if ($success) {
                sendResponse('success', 'Participant added successfully', [
                    'participant_id' => $pdo->lastInsertId(),
                    'participant_name' => $participantName
                ]);
            } else {
                sendResponse('failed', 'Failed to add participant');
            }
        }
        
        // GET PARTICIPANTS FOR AN EVENT
        if ($action === 'get_participants') {
            $eventId = intval($_POST['event_id'] ?? 0);
            
            if ($eventId <= 0) {
                sendResponse('failed', 'Event ID is required');
            }
            
            $stmt = $pdo->prepare("
                SELECT 
                    ep.id,
                    ep.user_id,
                    ep.account_number,
                    ep.participant_name,
                    ep.attended_at,
                    ep.added_by,
                    ep.notes
                FROM event_participants ep
                WHERE ep.event_id = :event_id
                ORDER BY ep.attended_at DESC
            ");
            $stmt->execute([':event_id' => $eventId]);
            $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            sendResponse('success', 'Participants loaded', ['participants' => $participants]);
        }
        
        // REMOVE PARTICIPANT FROM EVENT
        if ($action === 'remove_participant') {
            $participantId = intval($_POST['participant_id'] ?? 0);
            
            if ($participantId <= 0) {
                sendResponse('failed', 'Participant ID is required');
            }
            
            // Check permission
            $userRole = $_SESSION['user_role'] ?? 'user';
            if ($userRole !== 'admin' && $userRole !== 'superadmin') {
                sendResponse('failed', 'You do not have permission to remove participants');
            }
            
            $stmt = $pdo->prepare("DELETE FROM event_participants WHERE id = :id");
            $success = $stmt->execute([':id' => $participantId]);
            
            if ($success && $stmt->rowCount() > 0) {
                sendResponse('success', 'Participant removed successfully');
            } else {
                sendResponse('failed', 'Participant not found or already removed');
            }
        }
        
        // GET PARTICIPANT COUNT FOR AN EVENT
        if ($action === 'get_count') {
            $eventId = intval($_POST['event_id'] ?? 0);
            
            if ($eventId <= 0) {
                sendResponse('failed', 'Event ID is required');
            }
            
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM event_participants 
                WHERE event_id = :event_id
            ");
            $stmt->execute([':event_id' => $eventId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            sendResponse('success', 'Count retrieved', ['count' => intval($result['count'])]);
        }
        
        sendResponse('failed', 'Invalid action');
    }

    sendResponse('failed', 'Invalid request method');
    
} catch (PDOException $e) {
    error_log("Event Participants DB Error: " . $e->getMessage());
    sendResponse('failed', 'Database error occurred');
} catch (Exception $e) {
    error_log("Event Participants Error: " . $e->getMessage());
    sendResponse('failed', 'An error occurred');
}

ob_end_flush();
?>