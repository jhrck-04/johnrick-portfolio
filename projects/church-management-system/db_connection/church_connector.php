<?php
// Set timezone to Philippines
date_default_timezone_set('Asia/Manila');

// Add session configuration at the very top
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.use_cookies', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_httponly', 1);
    session_start();
}

$host = 'localhost';      
$dbname = 'church_management_db';
$dbuser = 'root';
$dbpass = '';

try {
    // Connect to the database
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $dbuser, $dbpass);

    // Set error mode to exceptions to handle errors
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Set MySQL timezone to Manila (UTC+8)
    $pdo->exec("SET time_zone = '+08:00'");

    // Set character encoding to UTF-8
    $pdo->exec("SET NAMES utf8mb4");

    // Set default fetch mode to associative array
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // For JSON API requests
    if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
        exit();
    }
    
    // For regular requests
    error_log("Database connection failed: " . $e->getMessage());
    die("Database connection failed. Please contact administrator.");
}