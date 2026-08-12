<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require_once '../db_connection/church_connector.php';

ob_end_clean();
header('Content-Type: application/json');

try {
    // Get total members count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM church_users 
        WHERE role = 'user' AND status = 'active'
    ");
    $stmt->execute();
    $membersCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get upcoming events count
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM calendar_events 
        WHERE event_date >= CURDATE() 
        AND is_finished = 0
    ");
    $stmt->execute();
    $eventsCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get next upcoming event
    $stmt = $pdo->prepare("
        SELECT event_title, event_date 
        FROM calendar_events 
        WHERE event_date >= CURDATE() 
        AND is_finished = 0
        ORDER BY event_date ASC 
        LIMIT 1
    ");
    $stmt->execute();
    $nextEvent = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get online users
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM church_users 
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
        AND status = 'active'
    ");
    $stmt->execute();
    $onlineUsersCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'status' => 'success',
        'data' => [
            'totalMembers' => (int)$membersCount,
            'upcomingEvents' => (int)$eventsCount,
            'nextEvent' => $nextEvent ? $nextEvent['event_title'] : 'No upcoming events',
            'onlineUsers' => (int)$onlineUsersCount
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch dashboard statistics'
    ]);
}