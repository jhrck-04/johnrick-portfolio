<?php
// Turn off all output buffering and error display
error_reporting(0);
ini_set('display_errors', 0);

// Start output buffering to catch any accidental output
ob_start();

require_once '../db_connection/church_connector.php';

// Clear any output that might have occurred
ob_end_clean();

// Now set the JSON header
header('Content-Type: application/json');

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Fetch all members from database
        $stmt = $pdo->prepare("
    SELECT 
        id,
        CONCAT(first_name, ' ', IFNULL(CONCAT(' ', middle_name), ''), ' ', last_name) as name,
        email,
        phone_number as phone,
        DATE_FORMAT(membership_date, '%Y-%m-%d') as joinDate,
        department as ministry,
        status,
        address,
        profile_picture
    FROM church_users
    WHERE role = 'user'
    ORDER BY first_name, last_name
");
        $stmt->execute();
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'success',
            'data' => $members
        ]);
        
    } elseif ($method === 'POST') {
        // Add or update member
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validation
        if (empty($input['name']) || empty($input['email'])) {
            throw new Exception('Name and email are required');
        }
        
        // Split name into parts
        $nameParts = explode(' ', trim($input['name']));
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? array_pop($nameParts) : '';
        $middleName = count($nameParts) > 1 ? implode(' ', $nameParts) : '';
        
        if (isset($input['id']) && $input['id']) {
            // Update existing member
            $stmt = $pdo->prepare("
                UPDATE church_users SET
                    first_name = ?,
                    middle_name = ?,
                    last_name = ?,
                    email = ?,
                    phone_number = ?,
                    address = ?,
                    membership_date = ?,
                    department = ?,
                    status = ?,
                    updated_at = NOW()
                WHERE id = ? AND role = 'user'
            ");
            
            $stmt->execute([
                $firstName,
                $middleName ?: null,
                $lastName,
                $input['email'],
                $input['phone'] ?? null,
                $input['address'] ?? null,
                $input['joinDate'] ?? null,
                $input['ministry'] ?? null,
                $input['status'] ?? 'Active',
                $input['id']
            ]);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Member updated successfully'
            ]);
            
        } else {
            // Insert new member
            $stmt = $pdo->prepare("
                INSERT INTO church_users 
                (first_name, middle_name, last_name, email, phone_number, address, 
                 membership_date, department, status, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', NOW())
            ");
            
            $stmt->execute([
                $firstName,
                $middleName ?: null,
                $lastName,
                $input['email'],
                $input['phone'] ?? null,
                $input['address'] ?? null,
                $input['joinDate'] ?? date('Y-m-d'),
                $input['ministry'] ?? null,
                $input['status'] ?? 'Active'
            ]);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Member added successfully',
                'id' => $pdo->lastInsertId()
            ]);
        }
        
    } elseif ($method === 'DELETE') {
        // Delete member
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input['id'])) {
            throw new Exception('Member ID is required');
        }
        
        $stmt = $pdo->prepare("DELETE FROM church_users WHERE id = ? AND role = 'user'");
        $stmt->execute([$input['id']]);
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Member deleted successfully'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
exit;