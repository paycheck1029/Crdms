<?php
// PHP Database Configuration helper

// Read environment variables (useful for containerized/managed runtimes)
$db_host = getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: '127.0.0.1';
$db_port = getenv('DB_PORT') ?: getenv('MYSQLPORT') ?: '3306';
$db_user = getenv('DB_USER') ?: getenv('MYSQLUSER') ?: 'root';
$db_pass = getenv('DB_PASSWORD') ?: getenv('MYSQLPASSWORD') ?: '';
$db_name = getenv('DB_NAME') ?: getenv('MYSQLDATABASE') ?: 'crdms';

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    error_log("Database connection failed in Public Portal: " . $e->getMessage());
    die("System Maintenance: We are experiencing connection issues. Please try again later.");
}
?>
