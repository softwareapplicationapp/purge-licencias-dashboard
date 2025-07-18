<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Database Connection Test</h1>";

try {
    require_once "connection.php";
    echo "<p>✅ connection.php loaded successfully</p>";
    
    // Test connection
    $testQuery = $db->query("SELECT 1");
    echo "<p>✅ Database connection successful</p>";
    
    // Show all tables
    $tablesQuery = $db->query("SHOW TABLES");
    $tables = $tablesQuery->fetchAll(PDO::FETCH_COLUMN);
    echo "<p>📋 Tables found: " . implode(', ', $tables) . "</p>";
    
    // Check apipremium table
    if (in_array('apipremium', $tables)) {
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM apipremium");
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p>📊 apipremium table: $totalCount records</p>";
        
        if ($totalCount > 0) {
            $sampleStmt = $db->prepare("SELECT * FROM apipremium LIMIT 3");
            $sampleStmt->execute();
            $sampleData = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);
            echo "<p>📄 Sample data from apipremium:</p>";
            echo "<pre>" . json_encode($sampleData, JSON_PRETTY_PRINT) . "</pre>";
        }
    } else {
        echo "<p>❌ apipremium table not found</p>";
    }
    
    // Check apipro table
    if (in_array('apipro', $tables)) {
        $countStmt = $db->prepare("SELECT COUNT(*) as total FROM apipro");
        $countStmt->execute();
        $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        echo "<p>📊 apipro table: $totalCount records</p>";
        
        if ($totalCount > 0) {
            $sampleStmt = $db->prepare("SELECT * FROM apipro LIMIT 3");
            $sampleStmt->execute();
            $sampleData = $sampleStmt->fetchAll(PDO::FETCH_ASSOC);
            echo "<p>📄 Sample data from apipro:</p>";
            echo "<pre>" . json_encode($sampleData, JSON_PRETTY_PRINT) . "</pre>";
        }
    } else {
        echo "<p>❌ apipro table not found</p>";
    }
    
} catch (Exception $e) {
    echo "<p>❌ Error: " . $e->getMessage() . "</p>";
}
?>