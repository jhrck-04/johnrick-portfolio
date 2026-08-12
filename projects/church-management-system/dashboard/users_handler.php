<?php
error_reporting(0);
ini_set('display_errors', 0);
ob_start();

require_once '../db_connection/church_connector.php';

ob_end_clean();

header('Content-Type: application/json');

// Must be logged in as superadmin
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

// Verify the requesting user is superadmin
try {
    $checkStmt = $pdo->prepare("SELECT role FROM church_users WHERE id = :id LIMIT 1");
    $checkStmt->execute([':id' => $_SESSION['user_id']]);
    $requester = $checkStmt->fetch();

    if (!$requester || $requester['role'] !== 'superadmin') {
        echo json_encode(['status' => 'error', 'message' => 'Access denied. SuperAdmin only.']);
        exit;
    }
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    // ── GET: Fetch all users ──────────────────────────────────────────────────
    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT
                id,
                username,
                CONCAT(
                    first_name,
                    CASE WHEN middle_name IS NOT NULL AND middle_name != '' THEN CONCAT(' ', middle_name) ELSE '' END,
                    ' ', last_name
                ) AS name,
                role,
                status,
                DATE_FORMAT(date_of_birth,  '%Y-%m-%d') AS birthday,
                DATE_FORMAT(created_at,     '%Y-%m-%d') AS dateJoined
            FROM church_users
            ORDER BY
                FIELD(role, 'superadmin', 'admin', 'user'),
                first_name, last_name
        ");
        $stmt->execute();
        $users = $stmt->fetchAll();

        // Capitalize status to match frontend expectation (Active / Inactive)
        foreach ($users as &$u) {
            $u['status'] = ucfirst(strtolower($u['status']));
        }
        unset($u);

        echo json_encode(['status' => 'success', 'data' => $users]);
        exit;
    }

    // ── POST: Change role or status ───────────────────────────────────────────
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? '';

        // -- Change role (promote / demote) -----------------------------------
        if ($action === 'change_role') {
            $targetId  = (int)($input['id']   ?? 0);
            $newRole   = trim($input['role']  ?? '');

            if (!$targetId || !in_array($newRole, ['user', 'admin', 'superadmin'], true)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
                exit;
            }

            // Protect the very first superadmin (id = 1) from being demoted
            if ($targetId === 1) {
                echo json_encode(['status' => 'error', 'message' => 'This account is protected and cannot be changed.']);
                exit;
            }

            // Prevent superadmin from demoting themselves
            if ($targetId === (int)$_SESSION['user_id'] && $newRole !== 'superadmin') {
                echo json_encode(['status' => 'error', 'message' => 'You cannot change your own role.']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE church_users SET role = :role, updated_at = NOW() WHERE id = :id");
            $stmt->execute([':role' => $newRole, ':id' => $targetId]);

            echo json_encode(['status' => 'success', 'message' => 'Role updated successfully.']);
            exit;
        }

        // -- Change status (active / inactive) --------------------------------
        if ($action === 'change_status') {
            $targetId   = (int)($input['id']     ?? 0);
            $newStatus  = strtolower(trim($input['status'] ?? ''));

            if (!$targetId || !in_array($newStatus, ['active', 'inactive'], true)) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
                exit;
            }

            if ($targetId === 1) {
                echo json_encode(['status' => 'error', 'message' => 'This account is protected and cannot be changed.']);
                exit;
            }

            if ($targetId === (int)$_SESSION['user_id']) {
                echo json_encode(['status' => 'error', 'message' => 'You cannot deactivate your own account.']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE church_users SET status = :status, updated_at = NOW() WHERE id = :id");
            $stmt->execute([':status' => $newStatus, ':id' => $targetId]);

            echo json_encode(['status' => 'success', 'message' => 'Status updated successfully.']);
            exit;
        }

        // -- Delete user -------------------------------------------------------
        if ($action === 'delete') {
            $targetId = (int)($input['id'] ?? 0);

            if (!$targetId) {
                echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
                exit;
            }

            if ($targetId === 1) {
                echo json_encode(['status' => 'error', 'message' => 'This account is protected and cannot be deleted.']);
                exit;
            }

            if ($targetId === (int)$_SESSION['user_id']) {
                echo json_encode(['status' => 'error', 'message' => 'You cannot delete your own account.']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM church_users WHERE id = :id");
            $stmt->execute([':id' => $targetId]);

            echo json_encode(['status' => 'success', 'message' => 'User deleted successfully.']);
            exit;
        }

        echo json_encode(['status' => 'error', 'message' => 'Unknown action']);
        exit;
    }

    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);

} catch (PDOException $e) {
    error_log("Users Handler DB Error: " . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Database error occurred']);
}