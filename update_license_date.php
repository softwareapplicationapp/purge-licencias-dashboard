<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log all requests
error_log("update_license_date.php called with method: " . $_SERVER['REQUEST_METHOD']);

require_once "connection.php";

// Verifica si es una solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar si es una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "INVALID_METHOD",
        "message" => "Only POST method is allowed"
    ]);
    exit;
}

$input = file_get_contents('php://input');
error_log("Raw input: " . $input);

$data = json_decode($input, true);
error_log("Decoded data: " . print_r($data, true));

if (!$data) {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "INVALID_JSON",
        "message" => "Invalid JSON data"
    ]);
    exit;
}

$action = $data['action'] ?? '';
$operation = $data['operation'] ?? 'add';
$days = $data['days'] ?? 1;

if (!in_array($action, ['update_by_serial', 'update_by_ids'])) {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "INVALID_ACTION",
        "message" => "Action must be 'update_by_serial' or 'update_by_ids'"
    ]);
    exit;
}

if (!in_array($operation, ['add', 'subtract'])) {
    http_response_code(400);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "INVALID_OPERATION",
        "message" => "Operation must be 'add' or 'subtract'"
    ]);
    exit;
}

try {
    $db->beginTransaction();
    
    if ($action === 'update_by_serial') {
        $serial = $data['serial'] ?? '';
        if (!$serial) {
            throw new Exception("Serial is required for update_by_serial action");
        }
        
        error_log("Updating license by serial: $serial, operation: $operation, days: $days");
        
        // First, try to find the license in apipremium table
        $stmt = $db->prepare("SELECT id, serial, licensedate FROM apipremium WHERE serial = ? AND licensedate != '1970-01-01 00:00:00' AND licensedate != '9999-12-31 23:59:59'");
        $stmt->execute([$serial]);
        $license = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($license) {
            error_log("Found license in apipremium table: " . json_encode($license));
            
            // Calculate new date
            $currentDate = new DateTime($license['licensedate']);
            if ($operation === 'add') {
                $currentDate->add(new DateInterval("P{$days}D"));
            } else {
                $currentDate->sub(new DateInterval("P{$days}D"));
            }
            $newDate = $currentDate->format('Y-m-d H:i:s');
            
            error_log("Updating apipremium: old date = {$license['licensedate']}, new date = $newDate");
            
            // Update the license
            $updateStmt = $db->prepare("UPDATE apipremium SET licensedate = ? WHERE serial = ?");
            $updateStmt->execute([$newDate, $serial]);
            
            $db->commit();
            
            header("Content-Type: application/json");
            echo json_encode([
                "success" => true,
                "message" => "License date updated successfully",
                "data" => [
                    "serial" => $serial,
                    "old_date" => $license['licensedate'],
                    "new_date" => $newDate,
                    "operation" => $operation,
                    "days" => $days,
                    "table" => "apipremium"
                ]
            ]);
            exit;
        }
        
        // If not found in apipremium, try apipro table
        $stmt = $db->prepare("SELECT id, serial, licensedate FROM apipro WHERE serial = ? AND licensedate != '1970-01-01 00:00:00' AND licensedate != '9999-12-31 23:59:59'");
        $stmt->execute([$serial]);
        $license = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($license) {
            error_log("Found license in apipro table: " . json_encode($license));
            
            // Calculate new date
            $currentDate = new DateTime($license['licensedate']);
            if ($operation === 'add') {
                $currentDate->add(new DateInterval("P{$days}D"));
            } else {
                $currentDate->sub(new DateInterval("P{$days}D"));
            }
            $newDate = $currentDate->format('Y-m-d H:i:s');
            
            error_log("Updating apipro: old date = {$license['licensedate']}, new date = $newDate");
            
            // Update the license
            $updateStmt = $db->prepare("UPDATE apipro SET licensedate = ? WHERE serial = ?");
            $updateStmt->execute([$newDate, $serial]);
            
            $db->commit();
            
            header("Content-Type: application/json");
            echo json_encode([
                "success" => true,
                "message" => "License date updated successfully",
                "data" => [
                    "serial" => $serial,
                    "old_date" => $license['licensedate'],
                    "new_date" => $newDate,
                    "operation" => $operation,
                    "days" => $days,
                    "table" => "apipro"
                ]
            ]);
            exit;
        }
        
        // License not found or not temporal
        throw new Exception("License not found or is not a temporal license (must have a valid date, not 1970 or 9999)");
        
    } elseif ($action === 'update_by_ids') {
        $licenseIds = $data['licenseIds'] ?? [];
        if (!is_array($licenseIds) || empty($licenseIds)) {
            throw new Exception("License IDs array is required for update_by_ids action");
        }
        
        error_log("Updating licenses by IDs: " . implode(',', $licenseIds) . ", operation: $operation, days: $days");
        
        $updatedLicenses = [];
        
        foreach ($licenseIds as $licenseId) {
            // Try apipremium first
            $stmt = $db->prepare("SELECT id, serial, licensedate FROM apipremium WHERE id = ? AND licensedate != '1970-01-01 00:00:00' AND licensedate != '9999-12-31 23:59:59'");
            $stmt->execute([$licenseId]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($license) {
                // Calculate new date
                $currentDate = new DateTime($license['licensedate']);
                if ($operation === 'add') {
                    $currentDate->add(new DateInterval("P{$days}D"));
                } else {
                    $currentDate->sub(new DateInterval("P{$days}D"));
                }
                $newDate = $currentDate->format('Y-m-d H:i:s');
                
                // Update the license
                $updateStmt = $db->prepare("UPDATE apipremium SET licensedate = ? WHERE id = ?");
                $updateStmt->execute([$newDate, $licenseId]);
                
                $updatedLicenses[] = [
                    "id" => $licenseId,
                    "serial" => $license['serial'],
                    "old_date" => $license['licensedate'],
                    "new_date" => $newDate,
                    "table" => "apipremium"
                ];
                continue;
            }
            
            // Try apipro
            $stmt = $db->prepare("SELECT id, serial, licensedate FROM apipro WHERE id = ? AND licensedate != '1970-01-01 00:00:00' AND licensedate != '9999-12-31 23:59:59'");
            $stmt->execute([$licenseId]);
            $license = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($license) {
                // Calculate new date
                $currentDate = new DateTime($license['licensedate']);
                if ($operation === 'add') {
                    $currentDate->add(new DateInterval("P{$days}D"));
                } else {
                    $currentDate->sub(new DateInterval("P{$days}D"));
                }
                $newDate = $currentDate->format('Y-m-d H:i:s');
                
                // Update the license
                $updateStmt = $db->prepare("UPDATE apipro SET licensedate = ? WHERE id = ?");
                $updateStmt->execute([$newDate, $licenseId]);
                
                $updatedLicenses[] = [
                    "id" => $licenseId,
                    "serial" => $license['serial'],
                    "old_date" => $license['licensedate'],
                    "new_date" => $newDate,
                    "table" => "apipro"
                ];
            }
        }
        
        $db->commit();
        
        $response = [
            "success" => true,
            "message" => "License dates updated successfully",
            "data" => [
                "updated_licenses" => $updatedLicenses,
                "operation" => $operation,
                "days" => $days,
                "total_updated" => count($updatedLicenses)
            ]
        ];
        
        header("Content-Type: application/json");
        echo json_encode($response);
        exit;
    }
    
} catch (Exception $e) {
    $db->rollBack();
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "DATABASE_ERROR",
        "message" => $e->getMessage()
    ]);
}
?></parameter>