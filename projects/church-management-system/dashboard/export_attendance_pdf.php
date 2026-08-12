<?php
// export_attendance_pdf.php - Generate professional PDF attendance report
session_start();

// Set timezone to Philippines
date_default_timezone_set('Asia/Manila');

// Check authentication
if (!isset($_SESSION['user_id'])) {
    die('Access denied. Please log in.');
}

// Get event ID from URL parameter
$eventId = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

if ($eventId <= 0) {
    die('Invalid event ID');
}

// Include database connection
require_once '../db_connection/church_connector.php';

// Include TCPDF library
require_once '../tcpdf/tcpdf.php';

try {
    // Fetch event details
    $stmt = $pdo->prepare("
        SELECT 
            id,
            event_date,
            event_title,
            event_time,
            location,
            event_type,
            created_by
        FROM calendar_events
        WHERE id = :event_id
    ");
    $stmt->execute([':event_id' => $eventId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$event) {
        die('Event not found');
    }
    
    // Fetch participants
    $stmt = $pdo->prepare("
        SELECT 
            ep.id,
            ep.account_number,
            ep.participant_name,
            ep.attended_at,
            ep.added_by
        FROM event_participants ep
        WHERE ep.event_id = :event_id
        ORDER BY ep.attended_at ASC
    ");
    $stmt->execute([':event_id' => $eventId]);
    $participants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Create new PDF document
    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('Jesus Is Lord Church MIS');
    $pdf->SetAuthor('JILC Administration');
    $pdf->SetTitle('Attendance Log - ' . $event['event_title']);
    $pdf->SetSubject('Event Attendance Report');
    
    // Remove default header/footer
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Set margins
    $pdf->SetMargins(15, 15, 15);
    $pdf->SetAutoPageBreak(true, 15);
    
    // Add a page
    $pdf->AddPage();
    
    // Set font
    $pdf->SetFont('helvetica', '', 10);
    
    // ==========================================
    // HEADER SECTION - Church Logo & Title
    // ==========================================
    
    // Church name and logo area
    $pdf->SetFont('helvetica', 'B', 18);
    $pdf->SetTextColor(37, 99, 235); // Blue color
    $pdf->Cell(0, 10, 'Jesus Is Lord Church', 0, 1, 'C');
    
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetTextColor(100, 116, 139); // Gray color
    $pdf->Cell(0, 5, 'Management Information System', 0, 1, 'C');
    
    // Draw line separator
    $pdf->Ln(3);
    $pdf->SetDrawColor(37, 99, 235);
    $pdf->SetLineWidth(0.5);
    $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
    $pdf->Ln(5);
    
    // ==========================================
    // TITLE SECTION
    // ==========================================
    
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->SetTextColor(51, 51, 51);
    $pdf->Cell(0, 8, 'ATTENDANCE LOG', 0, 1, 'C');
    $pdf->Ln(3);
    
    // ==========================================
    // EVENT DETAILS SECTION
    // ==========================================
    
    // Event details box with background
    $pdf->SetFillColor(239, 246, 255); // Light blue background
    $pdf->Rect(15, $pdf->GetY(), 180, 40, 'F');
    
    $yStart = $pdf->GetY() + 5;
    $pdf->SetY($yStart);
    
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->SetTextColor(37, 99, 235);
    $pdf->Cell(0, 6, htmlspecialchars($event['event_title'], ENT_QUOTES, 'UTF-8'), 0, 1, 'L');
    
    $pdf->SetFont('helvetica', '', 10);
    $pdf->SetTextColor(71, 85, 105);
    
    // Format date
    $eventDate = date('l, F j, Y', strtotime($event['event_date']));
    $pdf->Cell(0, 5, 'Date: ' . $eventDate, 0, 1, 'L');
    
    // Format time
    $eventTime = date('g:i A', strtotime($event['event_time']));
    $pdf->Cell(0, 5, 'Time: ' . $eventTime, 0, 1, 'L');
    
    $pdf->Cell(0, 5, 'Location: ' . htmlspecialchars($event['location'], ENT_QUOTES, 'UTF-8'), 0, 1, 'L');
    $pdf->Cell(0, 5, 'Event Type: ' . htmlspecialchars($event['event_type'], ENT_QUOTES, 'UTF-8'), 0, 1, 'L');
    
    $pdf->Ln(8);
    
    // ==========================================
    // STATISTICS SECTION
    // ==========================================
    
    $totalParticipants = count($participants);
    
    $pdf->SetFont('helvetica', 'B', 11);
    $pdf->SetTextColor(22, 163, 74); // Green color
    $pdf->Cell(0, 6, 'Total Participants: ' . $totalParticipants, 0, 1, 'L');
    $pdf->Ln(3);
    
    // ==========================================
    // PARTICIPANTS TABLE
    // ==========================================
    
    if ($totalParticipants > 0) {
        // Table header
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->SetFillColor(37, 99, 235); // Blue background
        $pdf->SetTextColor(255, 255, 255); // White text
        $pdf->SetDrawColor(37, 99, 235);
        
        // Column widths
        $colNo = 15;
        $colAccount = 30;
        $colName = 70;
        $colTime = 45;
        $colAddedBy = 20;
        
        $pdf->Cell($colNo, 8, '#', 1, 0, 'C', true);
        $pdf->Cell($colAccount, 8, 'Account No.', 1, 0, 'C', true);
        $pdf->Cell($colName, 8, 'Participant Name', 1, 0, 'C', true);
        $pdf->Cell($colTime, 8, 'Time Attended', 1, 0, 'C', true);
        $pdf->Cell($colAddedBy, 8, 'Added By', 1, 1, 'C', true);
        
        // Table rows
        $pdf->SetFont('helvetica', '', 9);
        $pdf->SetTextColor(51, 51, 51);
        $pdf->SetFillColor(249, 250, 251); // Light gray for alternating rows
        
        $rowNum = 1;
        foreach ($participants as $participant) {
            // Alternate row colors
            $fill = ($rowNum % 2 == 0) ? true : false;
            
            // Format time attended
            $timeAttended = date('M j, Y g:i A', strtotime($participant['attended_at']));
            
            // Truncate long names if needed
            $participantName = htmlspecialchars($participant['participant_name'], ENT_QUOTES, 'UTF-8');
            if (strlen($participantName) > 35) {
                $participantName = substr($participantName, 0, 32) . '...';
            }
            
            $addedBy = htmlspecialchars($participant['added_by'], ENT_QUOTES, 'UTF-8');
            if (strlen($addedBy) > 12) {
                $addedBy = substr($addedBy, 0, 9) . '...';
            }
            
            $pdf->Cell($colNo, 7, $rowNum, 1, 0, 'C', $fill);
            $pdf->Cell($colAccount, 7, $participant['account_number'], 1, 0, 'C', $fill);
            $pdf->Cell($colName, 7, $participantName, 1, 0, 'L', $fill);
            $pdf->Cell($colTime, 7, $timeAttended, 1, 0, 'C', $fill);
            $pdf->Cell($colAddedBy, 7, $addedBy, 1, 1, 'C', $fill);
            
            $rowNum++;
        }
    } else {
        // No participants message
        $pdf->SetFont('helvetica', 'I', 11);
        $pdf->SetTextColor(156, 163, 175);
        $pdf->Cell(0, 10, 'No participants recorded for this event.', 0, 1, 'C');
    }
    
    // ==========================================
    // FOOTER SECTION
    // ==========================================
    
    $pdf->Ln(10);
    
    // Draw line separator
    $pdf->SetDrawColor(203, 213, 225);
    $pdf->SetLineWidth(0.3);
    $pdf->Line(15, $pdf->GetY(), 195, $pdf->GetY());
    $pdf->Ln(3);
    
    // Footer information
    $pdf->SetFont('helvetica', '', 8);
    $pdf->SetTextColor(148, 163, 184);
    $pdf->Cell(0, 4, 'Generated by: ' . htmlspecialchars($_SESSION['full_name'] ?? $_SESSION['username'] ?? 'System', ENT_QUOTES, 'UTF-8'), 0, 1, 'L');
    $pdf->Cell(0, 4, 'Generated on: ' . date('F j, Y g:i A'), 0, 1, 'L');
    $pdf->Cell(0, 4, 'Report ID: ATT-' . str_pad($eventId, 6, '0', STR_PAD_LEFT) . '-' . date('Ymd'), 0, 1, 'L');
    
    // ==========================================
    // OUTPUT PDF
    // ==========================================
    
    // Generate filename
    $filename = 'Attendance_' . preg_replace('/[^A-Za-z0-9_-]/', '_', $event['event_title']) . '_' . date('Y-m-d') . '.pdf';
    
    // Output PDF to browser
    $pdf->Output($filename, 'I'); // 'I' = inline display in browser
    
} catch (PDOException $e) {
    die('Database error: ' . htmlspecialchars($e->getMessage()));
} catch (Exception $e) {
    die('Error generating PDF: ' . htmlspecialchars($e->getMessage()));
}
?>