<?php
/**
 * fetch_recent_activity.php
 * Returns the 5 most recent audit log entries for the dashboard Recent Activity widget.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once '../db_connection/church_connector.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Authentication required', 'activities' => []]);
    exit;
}

if (!isset($pdo)) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed', 'activities' => []]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT
            id,
            action,
            module,
            details,
            full_name,
            role,
            timestamp
        FROM audit_logs
        ORDER BY timestamp DESC
        LIMIT 5
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status'     => 'success',
        'activities' => $rows,
        'timestamp'  => date('Y-m-d H:i:s'),
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("fetch_recent_activity.php DB Error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Database error', 'activities' => []]);
}