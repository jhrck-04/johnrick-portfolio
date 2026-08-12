<?php
/**
 * Batch QR Code Generator for All Members
 * Displays all member QR codes on one page for printing
 */

session_start();
require_once '../db_connection/church_connector.php';

// Check authentication and admin permissions
if (!isset($_SESSION['user_id'])) {
    die('Access denied. Please log in.');
}

$userRole = $_SESSION['user_role'] ?? 'user';
if ($userRole !== 'admin' && $userRole !== 'superadmin') {
    die('Access denied. Admin permission required.');
}

// Get parameters
$qrSize = isset($_GET['size']) ? intval($_GET['size']) : 300;
$qrSize = max(200, min(600, $qrSize)); // Between 200-600px

// Fetch all active members
try {
    $stmt = $pdo->prepare("
        SELECT 
            id,
            account_number,
            CONCAT(first_name, ' ', IFNULL(CONCAT(middle_name, ' '), ''), last_name) as full_name,
            department
        FROM church_users 
        WHERE role = 'user' AND status = 'active'
        ORDER BY last_name, first_name
    ");
    $stmt->execute();
    $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die('Database error: ' . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Member QR Codes - Jesus Is Lord Church</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: Arial, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .controls {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .controls h1 {
            color: #2563eb;
            margin-bottom: 15px;
        }
        
        .controls-row {
            display: flex;
            gap: 15px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .control-group label {
            font-size: 14px;
            font-weight: bold;
            color: #555;
        }
        
        .control-group input,
        .control-group select {
            padding: 8px 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: #2563eb;
            color: white;
        }
        
        .btn-primary:hover {
            background: #1d4ed8;
        }
        
        .btn-success {
            background: #16a34a;
            color: white;
        }
        
        .btn-success:hover {
            background: #15803d;
        }
        
        .stats {
            background: #eff6ff;
            padding: 10px 15px;
            border-radius: 5px;
            border-left: 4px solid #2563eb;
        }
        
        .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        
        .qr-card {
            background: white;
            border: 2px solid #ddd;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .qr-card img {
            width: 100%;
            max-width: <?php echo $qrSize; ?>px;
            height: auto;
            border: 2px solid #000;
            border-radius: 5px;
            margin-bottom: 15px;
            background: white;
        }
        
        .qr-card .name {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        
        .qr-card .account {
            font-size: 14px;
            color: #6b7280;
            font-family: 'Courier New', monospace;
            background: #f3f4f6;
            padding: 5px 10px;
            border-radius: 5px;
            display: inline-block;
            margin-bottom: 5px;
        }
        
        .qr-card .department {
            font-size: 12px;
            color: #9ca3af;
        }
        
        .qr-card .download-btn {
            margin-top: 10px;
            padding: 8px 15px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 12px;
            display: inline-block;
            transition: all 0.3s;
        }
        
        .qr-card .download-btn:hover {
            background: #1d4ed8;
        }
        
        /* Print styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .controls {
                display: none;
            }
            
            .qr-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
            }
            
            .qr-card {
                border: 1px solid #000;
                box-shadow: none;
                padding: 10px;
            }
            
            .download-btn {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <!-- Controls -->
    <div class="controls">
        <h1><i class="fas fa-qrcode"></i> Member QR Codes</h1>
        
        <div class="controls-row">
            <div class="control-group">
                <label>QR Size:</label>
                <select id="sizeSelect" onchange="changeSize(this.value)">
                    <option value="200" <?php echo $qrSize === 200 ? 'selected' : ''; ?>>Small (200px)</option>
                    <option value="300" <?php echo $qrSize === 300 ? 'selected' : ''; ?>>Medium (300px)</option>
                    <option value="400" <?php echo $qrSize === 400 ? 'selected' : ''; ?>>Large (400px)</option>
                    <option value="500" <?php echo $qrSize === 500 ? 'selected' : ''; ?>>Extra Large (500px)</option>
                </select>
            </div>
            
            <button onclick="window.print()" class="btn btn-primary">
                <i class="fas fa-print"></i> Print All
            </button>
            
            <button onclick="downloadAll()" class="btn btn-success">
                <i class="fas fa-download"></i> Download All (ZIP)
            </button>
            
            <div class="stats">
                <strong><?php echo count($members); ?></strong> members
            </div>
        </div>
    </div>
    
    <!-- QR Grid -->
    <div class="qr-grid">
        <?php foreach ($members as $member): ?>
            <div class="qr-card">
                <img 
                    src="generate_qr_simple.php?account=<?php echo urlencode($member['account_number']); ?>&size=<?php echo $qrSize; ?>" 
                    alt="QR Code for <?php echo htmlspecialchars($member['full_name']); ?>"
                    loading="lazy"
                >
                <div class="name"><?php echo htmlspecialchars($member['full_name']); ?></div>
                <div class="account"><?php echo htmlspecialchars($member['account_number']); ?></div>
                <?php if (!empty($member['department'])): ?>
                    <div class="department"><?php echo htmlspecialchars($member['department']); ?></div>
                <?php endif; ?>
                <a 
                    href="generate_qr_simple.php?account=<?php echo urlencode($member['account_number']); ?>&size=500&download=1&name=<?php echo urlencode($member['full_name']); ?>" 
                    class="download-btn"
                    download
                >
                    <i class="fas fa-download"></i> Download
                </a>
            </div>
        <?php endforeach; ?>
    </div>
    
    <script>
        function changeSize(size) {
            window.location.href = '?size=' + size;
        }
        
        function downloadAll() {
            alert('To download all QR codes:\n\n1. Right-click on each QR code\n2. Select "Save image as..."\n\nOr use the individual Download buttons below each QR code.\n\nFor bulk download, consider using the Print function to save as PDF.');
        }
    </script>
</body>
</html>