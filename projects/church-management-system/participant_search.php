<?php
session_start();
require_once '../db_connection/church_connector.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

try {
    // $pdo is already created by church_connector.php, so we can use it directly!
    
    // Get search term
    $searchTerm = isset($_GET['term']) ? trim($_GET['term']) : '';

    if (empty($searchTerm)) {
        echo json_encode(['status' => 'success', 'results' => []]);
        exit;
    }

    // Search in church_users table by account_number, username, first_name, middle_name, or last_name
    $sql = "SELECT 
                id,
                account_number,
                username,
                CONCAT(first_name, ' ', IFNULL(middle_name, ''), ' ', last_name) AS full_name,
                first_name,
                last_name
            FROM church_users 
            WHERE (account_number LIKE :search1 
                OR username LIKE :search2
                OR first_name LIKE :search3
                OR last_name LIKE :search4
                OR CONCAT(first_name, ' ', last_name) LIKE :search5
                OR CONCAT(first_name, ' ', middle_name, ' ', last_name) LIKE :search6)
            AND status = 'active'
            LIMIT 10";

    $stmt = $pdo->prepare($sql);
    $searchPattern = "%{$searchTerm}%";
    $stmt->execute([
        ':search1' => $searchPattern,
        ':search2' => $searchPattern,
        ':search3' => $searchPattern,
        ':search4' => $searchPattern,
        ':search5' => $searchPattern,
        ':search6' => $searchPattern
    ]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'results' => $results
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}



