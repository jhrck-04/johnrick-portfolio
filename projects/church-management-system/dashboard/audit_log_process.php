<?php
/**
 * audit_log_process.php
 * Handles writing audit log entries and fetching / exporting them.
 *
 * Endpoints (all POST unless noted):
 *   action=log        – write a single log entry  (called silently from JS)
 *   action=fetch      – return logs with optional filters (GET or POST)
 *   action=export_csv – stream a CSV file for download (GET)
 */

ob_start();

// church_connector.php handles session_start()
require_once '../db_connection/church_connector.php';

ini_set('display_errors', 0);
error_reporting(E_ALL);

// ── helpers ──────────────────────────────────────────────────────────────────

function sendJson($status, $message = '', $data = null) {
    ob_end_clean();
    header('Content-Type: application/json');
    $r = ['status' => $status, 'message' => $message];
    if ($data !== null) $r = array_merge($r, $data);
    echo json_encode($r, JSON_UNESCAPED_UNICODE);
    exit;
}

function getUserIp() {
    foreach (['HTTP_CLIENT_IP','HTTP_X_FORWARDED_FOR','REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return null;
}

// ── auth check ────────────────────────────────────────────────────────────────

if (!isset($_SESSION['user_id'])) {
    sendJson('failed', 'Authentication required');
}

$sessionUserId   = $_SESSION['user_id'];
$sessionFullName = $_SESSION['full_name'] ?? $_SESSION['username'] ?? 'Unknown';
$sessionUsername = $_SESSION['username'] ?? 'Unknown';
$sessionRole     = $_SESSION['user_role'] ?? 'user';

if (!isset($pdo)) {
    sendJson('failed', 'Database connection failed');
}

// ── route ─────────────────────────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

try {

    // ── WRITE a log entry ────────────────────────────────────────────────────
    if ($action === 'log' && $method === 'POST') {

        $logAction  = strtoupper(trim($_POST['log_action']  ?? ''));
        $module     = trim($_POST['module']     ?? '');
        $details    = trim($_POST['details']    ?? '');

        $allowed = ['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT',
                    'MARK_FINISHED','ADD_PARTICIPANT','REMOVE_PARTICIPANT'];

        if (!in_array($logAction, $allowed)) {
            sendJson('failed', 'Invalid log action');
        }
        if (empty($module) || empty($details)) {
            sendJson('failed', 'Module and details are required');
        }

        // Fetch fresh full_name from DB to avoid stale session data
        $stmt = $pdo->prepare("
            SELECT TRIM(CONCAT(
                first_name,' ',
                COALESCE(NULLIF(middle_name,''),''),' ',
                last_name
            )) AS full_name
            FROM church_users WHERE id = :id LIMIT 1
        ");
        $stmt->execute([':id' => $sessionUserId]);
        $row = $stmt->fetch();
        $fullName = $row ? trim(preg_replace('/\s+/',' ',$row['full_name'])) : $sessionFullName;

        $stmt = $pdo->prepare("
            INSERT INTO audit_logs
                (user_id, username, full_name, role, action, module, details, ip_address)
            VALUES
                (:user_id, :username, :full_name, :role, :action, :module, :details, :ip)
        ");
        $stmt->execute([
            ':user_id'   => $sessionUserId,
            ':username'  => $sessionUsername,
            ':full_name' => $fullName,
            ':role'      => $sessionRole,
            ':action'    => $logAction,
            ':module'    => $module,
            ':details'   => $details,
            ':ip'        => getUserIp(),
        ]);

        sendJson('success', 'Logged');
    }

    // ── FETCH logs (admin / superadmin only) ─────────────────────────────────
    if ($action === 'fetch') {

        if (!in_array($sessionRole, ['admin','superadmin'])) {
            sendJson('failed', 'Access denied');
        }

        // Filters
        $filterAction = $_POST['filter_action'] ?? $_GET['filter_action'] ?? '';
        $filterModule = $_POST['filter_module'] ?? $_GET['filter_module'] ?? '';
        $filterFrom   = $_POST['filter_from']   ?? $_GET['filter_from']   ?? '';
        $filterTo     = $_POST['filter_to']     ?? $_GET['filter_to']     ?? '';
        $filterSearch = $_POST['filter_search'] ?? $_GET['filter_search'] ?? '';
        $page         = max(1, (int)($_POST['page'] ?? $_GET['page'] ?? 1));
        $perPage      = 25;
        $offset       = ($page - 1) * $perPage;

        $where  = [];
        $params = [];

        if ($filterAction) {
            $where[] = 'action = :action';
            $params[':action'] = strtoupper($filterAction);
        }
        if ($filterModule) {
            $where[] = 'module = :module';
            $params[':module'] = $filterModule;
        }
        if ($filterFrom) {
            $where[] = 'timestamp >= :from';
            $params[':from'] = $filterFrom . ' 00:00:00';
        }
        if ($filterTo) {
            $where[] = 'timestamp <= :to';
            $params[':to'] = $filterTo . ' 23:59:59';
        }
        if ($filterSearch) {
            $where[] = '(full_name LIKE :search OR details LIKE :search2 OR username LIKE :search3)';
            $params[':search']  = '%' . $filterSearch . '%';
            $params[':search2'] = '%' . $filterSearch . '%';
            $params[':search3'] = '%' . $filterSearch . '%';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // Total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM audit_logs $whereClause");
        $countStmt->execute($params);
        $totalRows = (int)$countStmt->fetchColumn();

        // Data
        $dataStmt = $pdo->prepare("
            SELECT id, timestamp, user_id, username, full_name, role, action, module, details, ip_address
            FROM audit_logs
            $whereClause
            ORDER BY timestamp DESC
            LIMIT :limit OFFSET :offset
        ");
        foreach ($params as $k => $v) $dataStmt->bindValue($k, $v);
        $dataStmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
        $dataStmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
        $dataStmt->execute();
        $logs = $dataStmt->fetchAll();

        sendJson('success', '', [
            'logs'       => $logs,
            'total'      => $totalRows,
            'page'       => $page,
            'per_page'   => $perPage,
            'total_pages'=> (int)ceil($totalRows / $perPage),
        ]);
    }

    // ── EXPORT CSV ───────────────────────────────────────────────────────────
    if ($action === 'export_csv' && $method === 'GET') {

        if (!in_array($sessionRole, ['admin','superadmin'])) {
            http_response_code(403);
            exit('Access denied');
        }

        $filterFrom   = $_GET['filter_from']   ?? '';
        $filterTo     = $_GET['filter_to']     ?? '';
        $filterAction = $_GET['filter_action'] ?? '';
        $filterModule = $_GET['filter_module'] ?? '';

        $where  = [];
        $params = [];

        if ($filterAction) { $where[] = 'action = :action'; $params[':action'] = strtoupper($filterAction); }
        if ($filterModule) { $where[] = 'module = :module'; $params[':module'] = $filterModule; }
        if ($filterFrom)   { $where[] = 'timestamp >= :from'; $params[':from'] = $filterFrom . ' 00:00:00'; }
        if ($filterTo)     { $where[] = 'timestamp <= :to';   $params[':to']   = $filterTo   . ' 23:59:59'; }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $stmt = $pdo->prepare("
            SELECT timestamp, full_name, username, role, action, module, details, ip_address
            FROM audit_logs
            $whereClause
            ORDER BY timestamp DESC
        ");
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Stream CSV
        ob_end_clean();
        $filename = 'audit_logs_' . date('Y-m-d') . '.csv';
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');

        $out = fopen('php://output', 'w');
        // BOM for Excel UTF-8
        fputs($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Timestamp','Full Name','Username','Role','Action','Module','Details','IP Address']);
        foreach ($rows as $row) {
            fputcsv($out, [
                $row['timestamp'],
                $row['full_name'],
                $row['username'],
                $row['role'],
                $row['action'],
                $row['module'],
                $row['details'],
                $row['ip_address'] ?? '',
            ]);
        }
        fclose($out);
        exit;
    }

    sendJson('failed', 'Invalid action or method');

} catch (PDOException $e) {
    error_log("Audit Log DB Error: " . $e->getMessage());
    sendJson('failed', 'Database error occurred');
} catch (Exception $e) {
    error_log("Audit Log Error: " . $e->getMessage());
    sendJson('failed', 'An error occurred');
}

ob_end_flush();
?>