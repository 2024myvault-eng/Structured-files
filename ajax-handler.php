<?php
require_once 'config/database.php';
$pdo = Database::getInstance();
session_start();

header('Content-Type: application/json');

// Simplified login for simulation
$_SESSION['user_id'] = 1;

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'admin_save_event':
        $stmt = $pdo->prepare("INSERT INTO tickets (user_id, title, venue, date_time, section, row, seat, image_url, total_amount, status) VALUES (1, :t, :v, :d, :s, :r, :st, :img, :amt, :status)");
        $success = $stmt->execute([
            't' => $_POST['title'],
            'v' => $_POST['venue'],
            'd' => $_POST['date_time'],
            's' => $_POST['section'],
            'r' => $_POST['row'],
            'st' => $_POST['seat'],
            'img' => $_POST['image_url'],
            'amt' => $_POST['total_amount'],
            'status' => $_POST['status']
        ]);
        echo json_encode(['status' => $success ? 'success' : 'error']);
        break;

    case 'get_my_events':
        $stmt = $pdo->query("SELECT * FROM tickets ORDER BY id DESC");
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    case 'update_profile_override':
        $_SESSION['override_name'] = $_POST['full_name'];
        $_SESSION['override_email'] = $_POST['email'];
        echo json_encode(['status' => 'success', 'new_name' => $_POST['full_name']]);
        break;

    default:
        echo json_encode(['status' => 'error', 'message' => 'Action not found']);
        break;
}
?>
