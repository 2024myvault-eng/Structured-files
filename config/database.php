<?php
class Database {
    private static $instance = null;
    public static function getInstance() {
        if (self::$instance === null) {
            $host = 'localhost';
            $db   = 'shopeagl_tickets';
            $user = 'shopeagl_admin';
            $pass = 'YOUR_DB_PASSWORD_HERE'; // <--- PUT YOUR PASSWORD HERE
            try {
                self::$instance = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                die("Connection failed: " . $e->getMessage());
            }
        }
        return self::$instance;
    }
}
?>