<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once "connection.php";

// Verifica si es una solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar si los datos POST se están recibiendo correctamente
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode("Invalid request method");
    exit;
}

$serials = json_decode(file_get_contents('php://input'), true);
if (!$serials || !is_array($serials)) {
    http_response_code(400);
    echo json_encode([
        "error" => "MISSING_PARAMETERS",
        "received_data" => $serials
    ]);
    exit;
}

try {
    $db->beginTransaction();
    
    $insertedLicenses = [];
    
    foreach ($serials as $serialData) {
        $serial = $serialData['serial'];
        $license = $serialData['license'];
        $cupon = $serialData['cupon'];
        $licenseType = isset($serialData['licenseType']) ? $serialData['licenseType'] : $license;
        
        if (!$serial || !$license) {
            throw new Exception("Missing parameters for serial or license.");
        }
        
        // Determine which table to use based on licenseType
        if ($licenseType === 'LIFETIME_PRO') {
            // Insert into apipro table
            $stmt = $db->prepare("INSERT INTO apipro (serial, license, cupon, licensedate, whitelist) VALUES (?, ?, ?, '9999-12-31 23:59:59', 'RESET')");
            $stmt->execute([$serial, $license, $cupon]);
        } else {
            // Insert into apipremium table
            $defaultDate = ($license === 'LIFETIME') ? '9999-12-31 23:59:59' : '1970-01-01 00:00:00';
            $stmt = $db->prepare("INSERT INTO apipremium (serial, license, cupon, licensedate, whitelist) VALUES (?, ?, ?, ?, 'RESET')");
            $stmt->execute([$serial, $license, $cupon, $defaultDate]);
        }
        
        $insertedLicenses[] = [
            'serial' => $serial,
            'license' => $license,
            'cupon' => $cupon,
            'licenseType' => $licenseType,
            'table' => ($licenseType === 'LIFETIME_PRO') ? 'apipro' : 'apipremium'
        ];
    }
    
    $db->commit();
    
    header('Content-Type: application/json');
    echo json_encode([
        "success" => true,
        "message" => "Licenses created successfully",
        "inserted_licenses" => $insertedLicenses,
        "count" => count($insertedLicenses)
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode([
        "error" => "DATABASE_ERROR",
        "message" => $e->getMessage()
    ]);
}
?>