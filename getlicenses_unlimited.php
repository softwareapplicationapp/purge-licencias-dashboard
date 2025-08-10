<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log all requests
error_log("getlicenses_unlimited.php called with method: " . $_SERVER['REQUEST_METHOD']);

require_once "connection.php";

// Verifica si es una solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar si es una solicitud GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["error" => "Invalid request method"]);
    exit;
}

try {
    error_log("=== STARTING UNLIMITED LICENSE FETCH ===");
    
    // Test database connection first
    $testQuery = $db->query("SELECT 1");
    if (!$testQuery) {
        throw new Exception("Database connection failed");
    }
    error_log("✅ Database connection successful");
    
    // Count total records in apipro (only table we use now)
    $countStmt = $db->prepare("SELECT COUNT(*) as total FROM apipro");
    $countStmt->execute();
    $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    error_log("📊 TOTAL RECORDS IN APIPRO: $totalCount");
    
    // Count by license type to see distribution
    $typeCountStmt = $db->prepare("
        SELECT license, COUNT(*) as count 
        FROM apipro 
        WHERE license IS NOT NULL AND license != '' 
        GROUP BY license 
        ORDER BY count DESC
    ");
    $typeCountStmt->execute();
    $typeCounts = $typeCountStmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("📋 LICENSE TYPE DISTRIBUTION:");
    foreach ($typeCounts as $type) {
        error_log("   - {$type['license']}: {$type['count']} licenses");
    }
    
    // Count valid records (with non-null, non-empty license)
    $validCountStmt = $db->prepare("SELECT COUNT(*) as total FROM apipro WHERE license IS NOT NULL AND license != ''");
    $validCountStmt->execute();
    $validCount = $validCountStmt->fetch(PDO::FETCH_ASSOC)['total'];
    error_log("✅ VALID RECORDS IN APIPRO (non-null license): $validCount");
    
    if ($validCount == 0) {
        error_log("⚠️ No valid licenses found!");
        echo json_encode([]);
        exit;
    }
    
    // Start fetching all licenses with pagination (no LIMIT!)
    $licenses = [];
    $pageSize = 5000; // Large pages for efficiency
    $offset = 0;
    $pageNumber = 1;
    $maxPages = 200; // Safety net for very large datasets
    
    error_log("🔄 Starting pagination with page size: $pageSize");
    
    while ($pageNumber <= $maxPages) {
        error_log("📄 Processing page $pageNumber (offset: $offset)...");
        
        // Fetch current page - NO HARDCODED LIMITS!
        $stmt = $db->prepare("
            SELECT id, serial, license, cupon, licensedate, whitelist, createdate as created_at, 'apipro' as source_table
            FROM apipro 
            WHERE license IS NOT NULL AND license != ''
            ORDER BY createdate DESC 
            LIMIT $pageSize OFFSET $offset
        ");
        $stmt->execute();
        $pageData = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $pageCount = count($pageData);
        error_log("📊 Page $pageNumber returned $pageCount records");
        
        if ($pageCount == 0) {
            error_log("📄 Page $pageNumber is empty, stopping pagination");
            break;
        }
        
        // Log first and last IDs of this page
        $firstId = $pageData[0]['id'];
        $lastId = $pageData[$pageCount - 1]['id'];
        error_log("🔢 Page $pageNumber: ID range $firstId to $lastId");
        
        // Process each license
        foreach ($pageData as &$license) {
            $license['id'] = (int)$license['id'];
            if (empty($license['cupon'])) {
                $license['cupon'] = null;
            }
            if (empty($license['licensedate'])) {
                $license['licensedate'] = '1970-01-01 00:00:00';
            }
        }
        
        // Add to main array
        $licenses = array_merge($licenses, $pageData);
        
        error_log("📈 Total licenses accumulated so far: " . count($licenses));
        
        // If we got less than page size, we're done
        if ($pageCount < $pageSize) {
            error_log("📄 Page $pageNumber returned less than $pageSize records, pagination complete");
            break;
        }
        
        // Prepare for next page
        $offset += $pageSize;
        $pageNumber++;
    }
    
    $finalCount = count($licenses);
    error_log("🏁 PAGINATION COMPLETE:");
    error_log("   - Pages processed: " . ($pageNumber - 1));
    error_log("   - Expected licenses: $validCount");
    error_log("   - Actually fetched: $finalCount");
    
    if ($finalCount != $validCount) {
        error_log("⚠️ MISMATCH! Expected $validCount but got $finalCount");
        error_log("   - Missing: " . ($validCount - $finalCount) . " licenses");
    } else {
        error_log("✅ PERFECT MATCH! All licenses fetched successfully");
    }
    
    // Final type distribution in results
    $resultTypes = [];
    foreach ($licenses as $license) {
        $type = $license['license'];
        $resultTypes[$type] = ($resultTypes[$type] ?? 0) + 1;
    }
    error_log("📋 FINAL RESULT DISTRIBUTION:");
    foreach ($resultTypes as $type => $count) {
        error_log("   - $type: $count licenses");
    }
    
    error_log("🚀 SENDING $finalCount licenses to frontend");
    echo json_encode($licenses);
    
} catch (Exception $e) {
    error_log("❌ ERROR in getlicenses_unlimited.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "DATABASE_ERROR",
        "message" => $e->getMessage()
    ]);
}
?>