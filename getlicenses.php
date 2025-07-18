<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log all requests
error_log("getlicenses.php called with method: " . $_SERVER['REQUEST_METHOD']);

require_once "connection.php";

// Verifica si es una solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar si es una solicitud GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode("Invalid request method");
    exit;
}

try {
    error_log("Starting to fetch licenses from both tables...");
    
    // Test database connection first
    error_log("Testing database connection...");
    $testQuery = $db->query("SELECT 1");
    if (!$testQuery) {
        error_log("Database connection failed!");
        throw new Exception("Database connection failed");
    }
    error_log("Database connection successful");
    
    // Check if tables exist
    error_log("Checking if tables exist...");
    $tablesQuery = $db->query("SHOW TABLES LIKE 'apipremium'");
    $premiumTableExists = $tablesQuery->rowCount() > 0;
    error_log("apipremium table exists: " . ($premiumTableExists ? 'YES' : 'NO'));
    
    $tablesQuery = $db->query("SHOW TABLES LIKE 'apipro'");
    $proTableExists = $tablesQuery->rowCount() > 0;
    error_log("apipro table exists: " . ($proTableExists ? 'YES' : 'NO'));
    
    $licenses = [];
    
    // Fetch from apipremium table
    if ($premiumTableExists) {
        error_log("Fetching from apipremium table...");
        
        // First count total records
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM apipremium");
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        error_log("Total records in apipremium: " . $totalCount);
        
        if ($totalCount > 0) {
            // Get some sample data
            $sampleStmt = $db->prepare("SELECT * FROM apipremium LIMIT 3");
            $sampleStmt->execute();
            $sampleData = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Sample data from apipremium: " . json_encode($sampleData));
        }
        
        $stmt = $db->prepare("
            SELECT id, serial, license, NULL as cupon, licensedate, whitelist, createdate as created_at, 'apipremium' as source_table
            FROM apipremium 
            ORDER BY createdate DESC 
            LIMIT 1000
        ");
        $stmt->execute();
        $premiumLicenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("Found " . count($premiumLicenses) . " licenses in apipremium table");
        
        $licenses = array_merge($licenses, $premiumLicenses);
    } else {
        error_log("apipremium table does not exist!");
    }
    
    // Fetch from apipro table
    if ($proTableExists) {
        error_log("Fetching from apipro table...");
        
        // First count total records
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM apipro");
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        error_log("Total records in apipro: " . $totalCount);
        
        if ($totalCount > 0) {
            // Get some sample data
            $sampleStmt = $db->prepare("SELECT * FROM apipro LIMIT 3");
            $sampleStmt->execute();
            $sampleData = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);
            error_log("Sample data from apipro: " . json_encode($sampleData));
        }
        
        $stmt = $db->prepare("
            SELECT id, serial, 
                   CASE 
                       WHEN license = 'LIFETIME' THEN 'PREMIUM'
                       ELSE license 
                   END as license,
                   NULL as cupon, licensedate, whitelist, createdate as created_at, 'apipro' as source_table
            FROM apipro 
            ORDER BY createdate DESC 
            LIMIT 1000
        ");
        $stmt->execute();
        $proLicenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        error_log("Found " . count($proLicenses) . " licenses in apipro table");
        
        $licenses = array_merge($licenses, $proLicenses);
    } else {
        error_log("apipro table does not exist!");
    }
    
    error_log("Total licenses combined: " . count($licenses));
    
    // Sort by created_at desc
    usort($licenses, function($a, $b) {
        return strtotime($b['created_at'] ?? '2000-01-01') - strtotime($a['created_at'] ?? '2000-01-01');
    });
    
    // Format the response
    foreach ($licenses as &$license) {
        $license['id'] = (int)$license['id'];
        if (empty($license['cupon'])) {
            $license['cupon'] = null;
        }
        if (empty($license['licensedate'])) {
            $license['licensedate'] = '1970-01-01 00:00:00';
        }
    }
    
    error_log("Returning " . count($licenses) . " licenses");
    
    header('Content-Type: application/json');
    echo json_encode($licenses);
    
} catch (Exception $e) {
    error_log("Database error in getlicenses.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "DATABASE_ERROR",
        "message" => $e->getMessage()
    ]);
}
?>