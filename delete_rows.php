<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log all requests
error_log("delete_rows.php called with method: " . $_SERVER['REQUEST_METHOD']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "connection.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "error" => "INVALID_METHOD",
        "message" => "Only POST method is allowed"
    ]);
    exit;
}

$input = file_get_contents('php://input');
error_log("Delete request input: " . $input);

$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        "error" => "INVALID_JSON",
        "message" => "Invalid JSON data"
    ]);
    exit;
}

// Support both 'ids' and 'serials' for flexibility
$serials = $data['serials'] ?? $data['ids'] ?? [];

if (!is_array($serials) || count($serials) === 0) {
    http_response_code(400);
    echo json_encode([
        "error" => "MISSING_PARAMETERS", 
        "message" => "Array of serials is required"
    ]);
    exit;
}

error_log("Attempting to delete " . count($serials) . " licenses: " . implode(', ', $serials));

try {
    $db->beginTransaction();

    // Check which serials exist in apipro table
    $placeholders = implode(',', array_fill(0, count($serials), '?'));
    $checkStmt = $db->prepare("SELECT serial, id, license FROM apipro WHERE serial IN ($placeholders)");
    $checkStmt->execute($serials);
    $existingLicenses = $checkStmt->fetchAll(PDO::FETCH_ASSOC);
    
    error_log("Found " . count($existingLicenses) . " existing licenses to delete");
    
    if (count($existingLicenses) === 0) {
        $db->rollBack();
        echo json_encode([
            "success" => false,
            "message" => "No licenses found with the provided serials",
            "attempted_serials" => $serials
        ]);
        exit;
    }

    // Delete the licenses
    $deleteStmt = $db->prepare("DELETE FROM apipro WHERE serial IN ($placeholders)");
    $deleteResult = $deleteStmt->execute($serials);
    
    if (!$deleteResult) {
        throw new Exception("Failed to delete licenses from database");
    }
    
    $deletedCount = $deleteStmt->rowCount();
    error_log("Successfully deleted $deletedCount licenses");

    $db->commit();
    
    echo json_encode([
        "success" => true,
        "message" => "Licenses deleted successfully",
        "data" => [
            "deleted_count" => $deletedCount,
            "deleted_licenses" => $existingLicenses,
            "requested_serials" => $serials
        ]
    ]);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Error deleting licenses: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "error" => "DATABASE_ERROR",
        "message" => $e->getMessage()
    ]);
}
?>