<?php
/**
 * Simple High-Quality QR Code Generator (No Composer Required)
 * Uses Google Chart API as fallback
 * 
 * Usage: 
 * - Display: generate_qr_simple.php?account=12345
 * - Download: generate_qr_simple.php?account=12345&download=1
 * - Custom size: generate_qr_simple.php?account=12345&size=800
 */

session_start();
require_once '../db_connection/church_connector.php';

// Check authentication
if (!isset($_SESSION['user_id'])) {
    die('Access denied. Please log in.');
}

// ==============================================
// CONFIGURATION
// ==============================================

$DEFAULT_SIZE = 500;        // Pixels
$MIN_SIZE = 200;
$MAX_SIZE = 1000;
$ERROR_CORRECTION = 'H';    // L, M, Q, H

// ==============================================
// GET PARAMETERS
// ==============================================

$accountNumber = $_GET['account'] ?? '';
$userName = $_GET['name'] ?? '';
$size = isset($_GET['size']) ? intval($_GET['size']) : $DEFAULT_SIZE;
$download = isset($_GET['download']) && $_GET['download'] === '1';

// Validate
$size = max($MIN_SIZE, min($MAX_SIZE, $size));

if (empty($accountNumber)) {
    die('Error: Account number required. Usage: generate_qr_simple.php?account=12345');
}

// ==============================================
// METHOD: Using QR Server API (High Quality PNG)
// ==============================================

// Build API URL for high-quality PNG
$apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
$params = http_build_query([
    'data' => $accountNumber,
    'size' => $size . 'x' . $size,
    'format' => 'png',
    'ecc' => $ERROR_CORRECTION,  // Error correction level
    'qzone' => 2,                // Quiet zone (border)
    'color' => '000000',         // Black
    'bgcolor' => 'FFFFFF',       // White
]);

$qrUrl = $apiUrl . '?' . $params;

// Fetch the QR code
$context = stream_context_create([
    'http' => [
        'timeout' => 10,
        'user_agent' => 'Church MIS QR Generator'
    ]
]);

$qrImage = @file_get_contents($qrUrl, false, $context);

if ($qrImage === false) {
    die('Error: Failed to generate QR code from API');
}

// Output headers
header('Content-Type: image/png');
header('Cache-Control: no-cache, must-revalidate');
header('Expires: 0');

if ($download) {
    $filename = 'QR_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $accountNumber);
    if (!empty($userName)) {
        $filename .= '_' . preg_replace('/[^A-Za-z0-9_-]/', '_', substr($userName, 0, 20));
    }
    header('Content-Disposition: attachment; filename="' . $filename . '.png"');
} else {
    header('Content-Disposition: inline; filename="QR_' . $accountNumber . '.png"');
}

// Output the image
echo $qrImage;
exit;
?>