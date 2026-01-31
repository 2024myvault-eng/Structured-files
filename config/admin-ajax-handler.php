<?php
// Fix for API errors and database issues
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Allow preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// SIMPLIFIED DATABASE CONNECTION - Use your exact credentials
$host = 'localhost';
$username = 'shopkzwc_shopeagle_admin';  // Your exact username
$password = 'Grind2cash@2024'; // REPLACE WITH YOUR ACTUAL PASSWORD
$database = 'shopkzwc_shopeagle';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        'success' => false, 
        'error' => 'Database connection failed: ' . $conn->connect_error,
        'details' => 'Check your database credentials in admin-ajax-handler.php'
    ]));
}

// Set charset
$conn->set_charset("utf8mb4");

// Get all request data (works for both POST and GET)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_REQUEST; // Fallback to $_REQUEST for form data
}

$action = isset($input['action']) ? $conn->real_escape_string($input['action']) : '';
$method = $_SERVER['REQUEST_METHOD'];

// Log for debugging (remove in production)
error_log("Action: $action, Method: $method, Input: " . json_encode($input));

// Handle actions
switch($action) {
    case 'create_event':
        // Create new event
        $title = isset($input['title']) ? $conn->real_escape_string($input['title']) : '';
        $date_time = isset($input['date_time']) ? $conn->real_escape_string($input['date_time']) : '';
        $venue = isset($input['venue']) ? $conn->real_escape_string($input['venue']) : '';
        $section = isset($input['section']) ? $conn->real_escape_string($input['section']) : 'General';
        $row = isset($input['row']) ? $conn->real_escape_string($input['row']) : '';
        $seat = isset($input['seat']) ? $conn->real_escape_string($input['seat']) : '';
        $ticket_level = isset($input['ticket_level']) ? $conn->real_escape_string($input['ticket_level']) : 'Standard';
        $image_url = isset($input['image_url']) ? $conn->real_escape_string($input['image_url']) : '';
        $flag_url = isset($input['flag_url']) ? $conn->real_escape_string($input['flag_url']) : '';
        $directions_url = isset($input['directions_url']) ? $conn->real_escape_string($input['directions_url']) : '';
        $num_tickets = isset($input['num_tickets']) ? intval($input['num_tickets']) : 1;
        $total_amount = isset($input['total_amount']) ? floatval($input['total_amount']) : 0.00;
        $status = isset($input['status']) ? $conn->real_escape_string($input['status']) : 'upcoming';
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
        
        // If no image URL, use placeholder
        if (empty($image_url)) {
            $image_url = 'https://via.placeholder.com/800x400/0A1E3C/FFFFFF?text=' . urlencode($title);
        }
        
        // If no flag URL, use USA flag
        if (empty($flag_url)) {
            $flag_url = 'https://flagcdn.com/w320/us.png';
        }
        
        // Insert into events table
        $sql = "INSERT INTO events (title, date_time, venue, section, row_num, seat, ticket_level, 
                image_url, flag_url, directions_url, num_tickets, total_amount, status, user_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("ssssssssssidss", 
                $title, $date_time, $venue, $section, $row, $seat, $ticket_level,
                $image_url, $flag_url, $directions_url, $num_tickets, $total_amount,
                $status, $user_id
            );
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'event_id' => $stmt->insert_id,
                    'message' => 'Event created successfully'
                ]);
            } else {
                echo json_encode([
                    'success' => false, 
                    'error' => 'Failed to execute query: ' . $stmt->error,
                    'sql_error' => $stmt->error
                ]);
            }
            $stmt->close();
        } else {
            echo json_encode([
                'success' => false, 
                'error' => 'Failed to prepare statement: ' . $conn->error
            ]);
        }
        break;
        
    case 'get_events':
        // Get events for user
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
        $status = isset($input['status']) ? $conn->real_escape_string($input['status']) : null;
        
        $sql = "SELECT * FROM events WHERE user_id = ?";
        $params = [$user_id];
        $types = "i";
        
        if ($status) {
            $sql .= " AND status = ?";
            $params[] = $status;
            $types .= "s";
        }
        
        $sql .= " ORDER BY date_time ASC";
        
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            if (count($params) > 0) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            
            $events = [];
            while ($row = $result->fetch_assoc()) {
                $events[] = $row;
            }
            
            echo json_encode(['success' => true, 'events' => $events]);
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare query']);
        }
        break;
        
    case 'update_event_status':
        // Update event status
        $event_id = isset($input['event_id']) ? intval($input['event_id']) : 0;
        $status = isset($input['status']) ? $conn->real_escape_string($input['status']) : 'upcoming';
        
        $sql = "UPDATE events SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("si", $status, $event_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event status updated']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to update event']);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare statement']);
        }
        break;
        
    case 'delete_event':
        // Delete event
        $event_id = isset($input['event_id']) ? intval($input['event_id']) : 0;
        
        $sql = "DELETE FROM events WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("i", $event_id);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Event deleted']);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to delete event']);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare statement']);
        }
        break;
        
    case 'update_identity':
        // FIXED: Update or insert user identity
        $full_name = isset($input['full_name']) ? $conn->real_escape_string($input['full_name']) : '';
        $email = isset($input['email']) ? $conn->real_escape_string($input['email']) : '';
        $location = isset($input['location']) ? $conn->real_escape_string($input['location']) : '';
        $username = isset($input['username']) ? $conn->real_escape_string($input['username']) : '';
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
        
        // Check if profile exists
        $check_sql = "SELECT id FROM user_profiles WHERE user_id = ?";
        $check_stmt = $conn->prepare($check_sql);
        
        if ($check_stmt) {
            $check_stmt->bind_param("i", $user_id);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            $check_stmt->close();
            
            if ($check_result->num_rows > 0) {
                // Update existing
                $sql = "UPDATE user_profiles SET 
                        full_name = ?, 
                        email = ?, 
                        location = ?, 
                        username = ?,
                        is_override = 1,
                        updated_at = NOW()
                        WHERE user_id = ?";
                
                $stmt = $conn->prepare($sql);
                if ($stmt) {
                    $stmt->bind_param("ssssi", $full_name, $email, $location, $username, $user_id);
                    
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Identity updated']);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Update failed: ' . $stmt->error]);
                    }
                    $stmt->close();
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to prepare update']);
                }
            } else {
                // Insert new
                $sql = "INSERT INTO user_profiles (user_id, full_name, email, location, username, is_override) 
                        VALUES (?, ?, ?, ?, ?, 1)";
                
                $stmt = $conn->prepare($sql);
                if ($stmt) {
                    $stmt->bind_param("issss", $user_id, $full_name, $email, $location, $username);
                    
                    if ($stmt->execute()) {
                        echo json_encode(['success' => true, 'message' => 'Identity created']);
                    } else {
                        echo json_encode(['success' => false, 'error' => 'Insert failed: ' . $stmt->error]);
                    }
                    $stmt->close();
                } else {
                    echo json_encode(['success' => false, 'error' => 'Failed to prepare insert']);
                }
            }
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to check existing profile']);
        }
        break;
        
    case 'get_identity':
        // Get user identity
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
        
        $sql = "SELECT * FROM user_profiles WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            $stmt->bind_param("i", $user_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $profile = $result->fetch_assoc();
                echo json_encode(['success' => true, 'profile' => $profile]);
            } else {
                echo json_encode(['success' => true, 'profile' => null, 'message' => 'No profile found']);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare query']);
        }
        break;
        
    case 'transfer_ticket':
        // Transfer ticket simulation
        $event_id = isset($input['event_id']) ? intval($input['event_id']) : 0;
        $first_name = isset($input['first_name']) ? $conn->real_escape_string($input['first_name']) : '';
        $last_name = isset($input['last_name']) ? $conn->real_escape_string($input['last_name']) : '';
        $email = isset($input['email']) ? $conn->real_escape_string($input['email']) : '';
        $note = isset($input['note']) ? $conn->real_escape_string($input['note']) : '';
        $user_id = isset($input['user_id']) ? intval($input['user_id']) : 1;
        
        // Generate order number
        $order_number = 'TM-' . date('Ymd') . '-' . strtoupper(substr(md5(rand()), 0, 6));
        
        $sql = "INSERT INTO transfers (event_id, sender_id, recipient_first_name, recipient_last_name, 
                recipient_email, note, order_number) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("iisssss", $event_id, $user_id, $first_name, $last_name, $email, $note, $order_number);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'order_number' => $order_number,
                    'transfer_id' => $stmt->insert_id,
                    'message' => 'Transfer initiated successfully'
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Transfer failed: ' . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to prepare transfer']);
        }
        break;
        
    case 'simulate_error':
        // Simulate error d34753K
        echo json_encode([
            'success' => false,
            'error_code' => 'd34753K',
            'message' => 'Transfer failed due to system constraints. Please try again later.',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'error' => 'Invalid action specified',
            'available_actions' => [
                'create_event', 'get_events', 'update_event_status', 
                'delete_event', 'update_identity', 'get_identity',
                'transfer_ticket', 'simulate_error'
            ],
            'received_action' => $action
        ]);
}

// Close connection
$conn->close();
?>