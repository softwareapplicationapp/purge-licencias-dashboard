<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log all requests
error_log("addlicenses_sellauth.php called with method: " . $_SERVER['REQUEST_METHOD']);

require_once "connection.php";

// Verifica si es una solicitud OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar si es una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode("Invalid request method");
    exit;
}

// SellAuth configuration
const SELL_AUTH_TOKEN = "5040780|kCqLsLfr68j1L4mF8lTg7a1bZW3VOQYMn7BpCSaP67d44d0d";
const SHOP_ID = "121539";

// Variant configuration matching your Python code
const VARIANT_CONFIG = [
    'WEEK' => [
        'product' => '211190',
        'variant' => '263237',
        'table' => 'apipremium'
    ],
    'MONTH' => [
        'product' => '204272',
        'variant' => '251890',
        'table' => 'apipremium'
    ],
    'LIFETIME' => [
        'product' => '204274',
        'variant' => '251892',
        'table' => 'apipremium'
    ],
    'LIFETIME_PRO' => [
        'product' => '320628',
        'variant' => '441430',
        'table' => 'apipro'
    ]
];

function getExistingDeliverables($productId, $variantId) {
    $url = "https://api.sellauth.com/v1/shops/" . SHOP_ID . "/products/$productId/deliverables/$variantId";
    
    $headers = [
        "Authorization: Bearer " . SELL_AUTH_TOKEN,
        "Accept: application/json"
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("SellAuth GET cURL error: " . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception("SellAuth GET API error: HTTP $httpCode - $response");
    }
    
    return json_decode($response, true);
}

function addSerialsToSellauth($productId, $variantId, $serials) {
    error_log("Starting addSerialsToSellauth for product: $productId, variant: $variantId");
    error_log("New serials to add: " . json_encode($serials));
    
    // Get existing deliverables first
    error_log("Getting existing deliverables...");
    $existingData = getExistingDeliverables($productId, $variantId);
    error_log("Existing deliverables response: " . json_encode($existingData));
    
    $existingSerials = [];
    
    if (is_array($existingData)) {
        $existingSerials = $existingData;
        error_log("Found " . count($existingSerials) . " existing serials");
    } else {
        error_log("No existing deliverables found or invalid format");
    }
    
    // Combine existing serials with new ones
    $combinedSerials = array_merge($existingSerials, $serials);
    error_log("Combined serials count: " . count($combinedSerials));
    error_log("Combined serials: " . json_encode($combinedSerials));
    
    // Now use overwrite endpoint with combined serials
    $url = "https://api.sellauth.com/v1/shops/" . SHOP_ID . "/products/$productId/deliverables/overwrite/$variantId";
    error_log("SellAuth PUT URL: " . $url);
    
    $headers = [
        "Authorization: Bearer " . SELL_AUTH_TOKEN,
        "Content-Type: application/json",
        "Accept: application/json"
    ];
    
    $payload = json_encode(['deliverables' => $combinedSerials]);
    error_log("SellAuth PUT payload: " . $payload);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    error_log("SellAuth PUT response: HTTP $httpCode - $response");
    if ($error) {
        throw new Exception("SellAuth PUT cURL error: " . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception("SellAuth PUT API error: HTTP $httpCode - $response");
    }
    
    return json_decode($response, true);
}

$input = file_get_contents('php://input');
error_log("SellAuth PHP - Raw input: " . $input);

$serials = json_decode($input, true);
error_log("SellAuth PHP - Decoded serials: " . print_r($serials, true));

if (!$serials || !is_array($serials)) {
    http_response_code(400);
    echo json_encode([
        "error" => "MISSING_PARAMETERS",
        "received_data" => $serials
    ]);
    exit;
}

try {
    error_log("Starting database transaction...");
    $db->beginTransaction();
    
    $insertedLicenses = [];
    $serialsByType = []; // Group serials by license type for SellAuth
    
    foreach ($serials as $serialData) {
        $serial = $serialData['serial'];
        $license = $serialData['license'];
        $cupon = $serialData['cupon'];
        $licenseType = isset($serialData['licenseType']) ? $serialData['licenseType'] : $license;
        
        error_log("Processing: serial=$serial, license=$license, cupon=$cupon, licenseType=$licenseType");
        
        if (!$serial || !$license) {
            throw new Exception("Missing parameters for serial or license.");
        }
        
        // Get table from variant config
        $config = VARIANT_CONFIG[$licenseType];
        if (!$config) {
            throw new Exception("Unknown license type: $licenseType");
        }
        
        $table = $config['table'];
        error_log("Using table: $table for license type: $licenseType");
        
        // Set license date based on type
        if ($licenseType === 'LIFETIME' || $licenseType === 'LIFETIME_PRO') {
            $licenseDate = '9999-12-31 23:59:59';
        } else {
            $licenseDate = '1970-01-01 00:00:00';
        }
        
        error_log("Preparing to insert into $table with date: $licenseDate");
        
        // Insert into database
        $stmt = $db->prepare("INSERT INTO $table (serial, license, licensedate, whitelist) VALUES (?, ?, ?, 'RESET')");
        $result = $stmt->execute([$serial, $license, $licenseDate]);
        
        if (!$result) {
            error_log("Failed to insert license: " . print_r($stmt->errorInfo(), true));
            throw new Exception("Failed to insert license into database");
        }
        
        error_log("Successfully inserted license: $serial into table: $table");
        
        $insertedLicenses[] = [
            'serial' => $serial,
            'license' => $license,
            'cupon' => $cupon, // Keep this for the response, even though it's not stored in DB
            'licenseType' => $licenseType,
            'table' => $table
        ];
        
        // Group serials by license type for SellAuth
        if (!isset($serialsByType[$licenseType])) {
            $serialsByType[$licenseType] = [];
        }
        $serialsByType[$licenseType][] = $serial;
    }
    
    error_log("Committing database transaction...");
    $db->commit();
    error_log("Database transaction committed successfully");
    
    // Push serials to SellAuth for each license type
    $sellAuthResponses = [];
    foreach ($serialsByType as $licenseType => $typeSerials) {
        $config = VARIANT_CONFIG[$licenseType];
        try {
            error_log("Pushing to SellAuth - Product: {$config['product']}, Variant: {$config['variant']}, Serials: " . implode(',', $typeSerials));
            $sellAuthResponse = addSerialsToSellauth($config['product'], $config['variant'], $typeSerials);
            $sellAuthResponses[$licenseType] = $sellAuthResponse;
            error_log("SellAuth response for $licenseType: " . json_encode($sellAuthResponse));
        } catch (Exception $e) {
            error_log("SellAuth error for $licenseType: " . $e->getMessage());
            // Continue with database commit even if SellAuth fails
            $sellAuthResponses[$licenseType] = ['error' => $e->getMessage()];
        }
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        "success" => true,
        "message" => "Licenses created successfully",
        "inserted_licenses" => $insertedLicenses,
        "count" => count($insertedLicenses),
        "sellauth_responses" => $sellAuthResponses
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "DATABASE_ERROR",
        "message" => $e->getMessage()
    ]);
}
?>