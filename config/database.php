<?php
class Database {
    private static $connection = null;
    
    public static function getConnection() {
        if (self::$connection === null) {
            // YOUR EXACT DATABASE CREDENTIALS
            $host = 'localhost';
            $username = 'shopkzwc_shopeagle_admin';  // Your actual username
            $password = 'Grind2cash@2024'; // You need to fill this in!
            $database = 'shopkzwc_shopeagle';        // Your database name
            
            try {
                self::$connection = new mysqli($host, $username, $password, $database);
                
                if (self::$connection->connect_error) {
                    // Don't show error to users, log it
                    error_log("Database connection failed: " . self::$connection->connect_error);
                    return null;
                }
                
                // Set UTF-8 character set
                self::$connection->set_charset("utf8mb4");
                
                // Set timezone
                self::$connection->query("SET time_zone = '+00:00'");
                
            } catch (Exception $e) {
                error_log("Database exception: " . $e->getMessage());
                return null;
            }
        }
        return self::$connection;
    }
    
    public static function closeConnection() {
        if (self::$connection !== null) {
            self::$connection->close();
            self::$connection = null;
        }
    }
}
?>
