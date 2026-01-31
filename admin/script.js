// Admin Panel JavaScript - COMPLETELY FIXED VERSION
// All API errors resolved

const API_BASE = '../config/admin-ajax-handler.php'; // Your PHP backend
let currentUser = 1; // Default user ID

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupTabs();
    setupEventListeners();
    loadEvents();
    loadEventsForTransfer();
    loadIdentity();
});

// Tab Navigation
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Event Listeners
function setupEventListeners() {
    // Event form submission
    document.getElementById('eventForm').addEventListener('submit', function(e) {
        e.preventDefault();
        createEvent();
    });
    
    // Identity form submission
    document.getElementById('identityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateIdentity();
    });
    
    // Transfer form submission
    document.getElementById('transferForm').addEventListener('submit', function(e) {
        e.preventDefault();
        proceedToTransfer();
    });
    
    // Clear event form
    document.getElementById('clearForm').addEventListener('click', function() {
        document.getElementById('eventForm').reset();
        showNotification('Form cleared', 'info');
    });
    
    // Refresh events
    document.getElementById('refreshEvents').addEventListener('click', loadEvents);
    
    // Load identity
    document.getElementById('loadIdentity').addEventListener('click', loadIdentity);
    
    // Trigger error simulation
    document.getElementById('triggerError').addEventListener('click', simulateError);
    
    // Transfer navigation
    document.getElementById('newTransfer').addEventListener('click', function() {
        showTransferStep(1);
        document.getElementById('transferForm').reset();
    });
    
    document.getElementById('cancelTransfer').addEventListener('click', simulateError);
    document.getElementById('errorOk').addEventListener('click', function() {
        showTransferStep(1);
    });
    
    // Modal close
    document.querySelector('.close').addEventListener('click', function() {
        document.getElementById('ticketModal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('ticketModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// FIXED API Helper Function - NO MORE "GET cannot have a body" error
async function apiCall(action, data = {}, method = 'POST') {
    try {
        let url = API_BASE;
        let options = {
            method: method,
            headers: {
                'Accept': 'application/json',
            }
        };
        
        // ALWAYS use POST for all actions to avoid GET-with-body error
        // Convert all requests to POST with proper data handling
        const params = new URLSearchParams();
        params.append('action', action);
        
        // Add all data to params
        for (const key in data) {
            if (data[key] !== null && data[key] !== undefined) {
                params.append(key, data[key].toString());
            }
        }
        
        // Set as POST with form data
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.body = params.toString();
        
        console.log(`API Call: ${action}`, { url, data, method });
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`${action} response:`, result);
        return result;
        
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`API Error: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

// Create Event - FIXED with proper error handling
async function createEvent() {
    const eventData = {
        title: document.getElementById('title').value,
        date_time: document.getElementById('date').value,
        venue: document.getElementById('venue').value,
        section: document.getElementById('section').value,
        row: document.getElementById('row').value,
        seat: document.getElementById('seat').value,
        ticket_level: document.getElementById('ticketLevel').value,
        image_url: document.getElementById('imageUrl').value || 'https://via.placeholder.com/800x400?text=Event+Image',
        flag_url: document.getElementById('flagUrl').value || 'https://via.placeholder.com/100x60?text=Flag',
        directions_url: document.getElementById('directionsUrl').value || '#',
        num_tickets: document.getElementById('numTickets').value || 1,
        total_amount: document.getElementById('totalAmount').value || 0.00,
        status: document.getElementById('status').value,
        user_id: currentUser
    };
    
    // Validate required fields
    if (!eventData.title || !eventData.date_time || !eventData.venue) {
        showNotification('Please fill in all required fields (Title, Date/Time, Venue)', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#eventForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    submitBtn.disabled = true;
    
    const result = await apiCall('create_event', eventData);
    
    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        showNotification('Event created successfully!', 'success');
        document.getElementById('eventForm').reset();
        loadEvents();
        loadEventsForTransfer();
    } else {
        showNotification(`Failed to create event: ${result.error || 'Unknown error'}`, 'error');
    }
}

// Load Events - FIXED (using POST instead of GET)
async function loadEvents() {
    const eventsList = document.getElementById('eventsList');
    eventsList.innerHTML = '<div class="loading">Loading events...</div>';
    
    const result = await apiCall('get_events', {
        user_id: currentUser
    });
    
    if (result.success && result.events && result.events.length > 0) {
        eventsList.innerHTML = result.events.map(event => {
            // Format the date for display
            let displayDate = event.date_time;
            try {
                const dateObj = new Date(event.date_time);
                if (!isNaN(dateObj)) {
                    displayDate = dateObj.toLocaleString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            } catch (e) {
                // Keep original date if parsing fails
            }
            
            return `
                <div class="event-card">
                    ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="event-image">` : ''}
                    <div class="event-content">
                        <h4 class="event-title">${event.title}</h4>
                        <div class="event-meta">
                            <p><i class="far fa-calendar"></i> ${displayDate}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                            <p><i class="fas fa-chair"></i> ${event.section}, Row ${event.row_num}, Seat ${event.seat}</p>
                            <p><strong>Status:</strong> ${event.status} | <strong>Total:</strong> $${parseFloat(event.total_amount).toFixed(2)}</p>
                        </div>
                        <div class="event-actions">
                            <button class="btn btn-small" onclick="viewTicket(${event.id})">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-small btn-secondary" onclick="moveEvent(${event.id}, '${event.status === 'upcoming' ? 'past' : 'upcoming'}')">
                                <i class="fas fa-exchange-alt"></i> Move
                            </button>
                            <button class="btn btn-small btn-danger" onclick="deleteEvent(${event.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        eventsList.innerHTML = '<div class="loading">No events found. Create your first event above!</div>';
    }
}

// View Ticket Details
async function viewTicket(eventId) {
    const modal = document.getElementById('ticketModal');
    const details = document.getElementById('ticketDetails');
    
    // Try to get event details
    const result = await apiCall('get_events', { user_id: currentUser });
    
    let eventDetails = '';
    if (result.success && result.events) {
        const event = result.events.find(e => e.id == eventId);
        if (event) {
            eventDetails = `
                <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #0A1E3C;">
                    <h4 style="color: #0A1E3C; margin-bottom: 15px;">${event.title}</h4>
                    <div style="display: grid; gap: 8px; font-size: 0.95rem;">
                        <div><strong>Date:</strong> ${event.date_time}</div>
                        <div><strong>Venue:</strong> ${event.venue}</div>
                        <div><strong>Location:</strong> ${event.section}, Row ${event.row_num}, Seat ${event.seat}</div>
                        <div><strong>Ticket Level:</strong> ${event.ticket_level}</div>
                        <div><strong>Status:</strong> ${event.status}</div>
                        <div><strong>Total Amount:</strong> $${parseFloat(event.total_amount).toFixed(2)}</div>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc; text-align: center;">
                            <div style="font-family: monospace; letter-spacing: 3px; background: #f5f5f5; padding: 10px; border-radius: 5px;">
                                TICKET-${String(eventId).padStart(6, '0')}
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px dashed #ccc; display: flex; gap: 10px;">
                        <button class="btn btn-small" style="flex: 1;">
                            <i class="fas fa-print"></i> Print
                        </button>
                        <button class="btn btn-small btn-secondary" style="flex: 1;">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    if (!eventDetails) {
        eventDetails = `
            <div style="background: white; padding: 20px; border-radius: 10px; border: 2px solid #0A1E3C;">
                <h4 style="color: #0A1E3C; margin-bottom: 15px;">Ticket Details</h4>
                <div style="display: grid; gap: 10px;">
                    <div><strong>Event ID:</strong> ${eventId}</div>
                    <div><strong>Status:</strong> Active</div>
                    <div><strong>Ticket Number:</strong> <span style="font-family: monospace;">TM-${String(eventId).padStart(8, '0')}</span></div>
                </div>
            </div>
        `;
    }
    
    details.innerHTML = eventDetails;
    modal.style.display = 'flex';
}

// Move Event Status
async function moveEvent(eventId, newStatus) {
    if (!confirm(`Are you sure you want to move this event to ${newStatus}?`)) return;
    
    const result = await apiCall('update_event_status', {
        event_id: eventId,
        status: newStatus
    });
    
    if (result.success) {
        showNotification(`Event moved to ${newStatus} successfully!`, 'success');
        loadEvents();
        loadEventsForTransfer();
    } else {
        showNotification('Failed to move event', 'error');
    }
}

// Delete Event
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    
    const result = await apiCall('delete_event', {
        event_id: eventId
    });
    
    if (result.success) {
        showNotification('Event deleted successfully!', 'success');
        loadEvents();
        loadEventsForTransfer();
    } else {
        showNotification('Failed to delete event', 'error');
    }
}

// Identity Management - FIXED
async function updateIdentity() {
    const identityData = {
        full_name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        location: document.getElementById('location').value,
        username: document.getElementById('username').value,
        user_id: currentUser
    };
    
    // Validate
    if (!identityData.full_name && !identityData.email && !identityData.location && !identityData.username) {
        showNotification('Please fill at least one field to update identity', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('#identityForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    const result = await apiCall('update_identity', identityData);
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        showNotification('Identity overridden successfully!', 'success');
    } else {
        showNotification(`Failed to update identity: ${result.error || 'Unknown error'}`, 'error');
    }
}

// Load Identity - FIXED
async function loadIdentity() {
    const result = await apiCall('get_identity', {
        user_id: currentUser
    });
    
    if (result.success && result.profile) {
        document.getElementById('fullName').value = result.profile.full_name || '';
        document.getElementById('email').value = result.profile.email || '';
        document.getElementById('location').value = result.profile.location || '';
        document.getElementById('username').value = result.profile.username || '';
        showNotification('Identity loaded successfully!', 'success');
    } else if (result.success && !result.profile) {
        showNotification('No identity override found. Fill the form to create one.', 'info');
    } else {
        showNotification('Failed to load identity', 'error');
    }
}

// Transfer Management
async function loadEventsForTransfer() {
    const select = document.getElementById('eventSelect');
    select.innerHTML = '<option value="">Loading events...</option>';
    
    const result = await apiCall('get_events', {
        user_id: currentUser,
        status: 'upcoming'
    });
    
    if (result.success && result.events && result.events.length > 0) {
        select.innerHTML = '<option value="">Select an event...</option>' + 
            result.events.map(event => 
                `<option value="${event.id}">${event.title} (${event.date_time})</option>`
            ).join('');
    } else {
        select.innerHTML = '<option value="">No upcoming events available</option>';
    }
}

function showTransferStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.transfer-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show the selected step
    document.getElementById(`step${stepNumber}`).classList.add('active');
}

async function proceedToTransfer() {
    const transferData = {
        event_id: document.getElementById('eventSelect').value,
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('recipientEmail').value,
        note: document.getElementById('note').value,
        user_id: currentUser
    };
    
    // Validate
    if (!transferData.event_id || !transferData.first_name || !transferData.last_name || !transferData.email) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('#transferForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
    
    const result = await apiCall('transfer_ticket', transferData);
    
    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        // Update success display
        document.getElementById('successName').textContent = 
            `${transferData.first_name} ${transferData.last_name}`;
        document.getElementById('successEmail').textContent = transferData.email;
        document.getElementById('orderNumber').textContent = result.order_number || 'TM-' + Date.now();
        document.getElementById('successNote').textContent = transferData.note || 'None';
        
        // Show success step
        showTransferStep(2);
    } else {
        simulateError();
    }
}

function simulateError() {
    // Show error step
    showTransferStep(3);
    
    // Set error code
    document.getElementById('errorCode').textContent = 'd34753K';
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2E7D32' : type === 'error' ? '#E53935' : '#0A1E3C'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        margin-left: 10px;
    }
`;
document.head.appendChild(style);

// Test API connection
window.testAPI = async function() {
    console.log('Testing API connection...');
    const result = await apiCall('get_events', { user_id: currentUser });
    console.log('Test result:', result);
    showNotification(`API Test: ${result.success ? 'Connected!' : 'Failed'}`, result.success ? 'success' : 'error');
    return result;
};