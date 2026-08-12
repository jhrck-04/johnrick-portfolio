<?php
// church_connector.php will handle session_start()
require_once '../db_connection/church_connector.php';

// Debug: Log session data
error_log("Profile Handler - Session ID: " . session_id());
error_log("Profile Handler - Session Data: " . print_r($_SESSION, true));
error_log("Profile Handler - User ID: " . (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'NOT SET'));

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    error_log("Profile Handler - Authentication failed: No user_id in session");
    echo json_encode([
        'status' => 'error', 
        'message' => 'Not authenticated',
        'debug' => [
            'session_id' => session_id(),
            'has_session' => !empty($_SESSION),
            'session_keys' => array_keys($_SESSION)
        ]
    ]);
    exit();
}

$user_id = $_SESSION['user_id'];

// Handle GET request - Fetch user profile data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                username,
                email,
                first_name,
                middle_name,
                last_name,
                role,
                status,
                account_number,
                date_of_birth,
                gender,
                marital_status,
                occupation,
                skills,
                phone_number,
                address,
                city,
                zip_code,
                emergency_contact_name,
                emergency_contact_phone,
                department,
                membership_date,
                baptism_date,
                bio,
                profile_picture,
                created_at,
                updated_at,
                last_login
            FROM church_users 
            WHERE id = :user_id
        ");
        
        $stmt->execute(['user_id' => $user_id]);
        $user = $stmt->fetch();
        
        if ($user) {
    // Combine first, middle, last name into full name for display
    $nameParts = array_filter([
        $user['first_name'], 
        $user['middle_name'], 
        $user['last_name']
    ]); // Remove empty values
    $user['name'] = implode(' ', $nameParts);
            
            echo json_encode([
                'status' => 'success',
                'data' => $user
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'User not found'
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Profile fetch error: " . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to fetch profile data'
        ]);
    }
    exit();
}

// Handle POST request - Update user profile
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Use the individual name fields directly from JavaScript
$firstName = trim($input['firstName'] ?? '');
$middleName = trim($input['middleName'] ?? '');
$lastName = trim($input['lastName'] ?? '');
        
        // Prepare update statement
        $stmt = $pdo->prepare("
            UPDATE church_users SET
                first_name = :first_name,
                middle_name = :middle_name,
                last_name = :last_name,
                email = :email,
                date_of_birth = :date_of_birth,
                gender = :gender,
                marital_status = :marital_status,
                occupation = :occupation,
                skills = :skills,
                phone_number = :phone_number,
                address = :address,
                city = :city,
                zip_code = :zip_code,
                emergency_contact_name = :emergency_contact_name,
                emergency_contact_phone = :emergency_contact_phone,
                department = :department,
                membership_date = :membership_date,
                baptism_date = :baptism_date,
                bio = :bio,
                profile_picture = :profile_picture,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :user_id
        ");
        
        // Execute with parameters
        $result = $stmt->execute([
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'email' => $input['email'] ?? null,
            'date_of_birth' => !empty($input['dateOfBirth']) ? $input['dateOfBirth'] : null,
            'gender' => !empty($input['gender']) ? $input['gender'] : null,
            'marital_status' => !empty($input['maritalStatus']) ? $input['maritalStatus'] : null,
            'occupation' => $input['occupation'] ?? null,
            'skills' => $input['skills'] ?? null,
            'phone_number' => $input['phoneNumber'] ?? null,
            'address' => $input['address'] ?? null,
            'city' => $input['city'] ?? null,
            'zip_code' => $input['zipCode'] ?? null,
            'emergency_contact_name' => $input['emergencyContact'] ?? null,
            'emergency_contact_phone' => $input['emergencyPhone'] ?? null,
            'department' => !empty($input['department']) ? $input['department'] : null,
            'membership_date' => !empty($input['membershipDate']) ? $input['membershipDate'] : null,
            'baptism_date' => !empty($input['baptismDate']) ? $input['baptismDate'] : null,
            'bio' => $input['bio'] ?? null,
            'profile_picture' => $input['profilePicture'] ?? null,
            'user_id' => $user_id
        ]);

        // ADD THESE DEBUG LOGS ⬇️
error_log("Profile Update - User ID: " . $user_id);
error_log("Profile Update - Has Profile Picture: " . (!empty($input['profilePicture']) ? 'YES' : 'NO'));
if (!empty($input['profilePicture'])) {
    error_log("Profile Picture Length: " . strlen($input['profilePicture']));
}
        
        if ($result) {
            // Fetch updated user data
            $stmt = $pdo->prepare("SELECT * FROM church_users WHERE id = :user_id");
            $stmt->execute(['user_id' => $user_id]);
            $updatedUser = $stmt->fetch();
            
            // Combine names for session
            $fullName = trim($updatedUser['first_name'] . ' ' . $updatedUser['middle_name'] . ' ' . $updatedUser['last_name']);
            $updatedUser['name'] = $fullName;
            
            // Update session
            $_SESSION['user_name'] = $fullName;
            $_SESSION['user_email'] = $updatedUser['email'];
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => $updatedUser
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Failed to update profile'
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Profile update error: " . $e->getMessage());
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }
    exit();
}

// Invalid request method
echo json_encode([
    'status' => 'error',
    'message' => 'Invalid request method'
]);