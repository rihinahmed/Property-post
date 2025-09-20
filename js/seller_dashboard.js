// js/seller_dashboard.js

const API_BASE_URL = "http://localhost:5000/api";

// Helper function to show notifications
function showNotification(message, type = 'info') {
    const notificationContainer = document.querySelector('.notification-container') || document.body;
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    notificationContainer.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

// Function to fetch dashboard summary data
async function fetchSummaryData() {
    try {
        const response = await fetch(`${API_BASE_URL}/seller/dashboard`, {
            credentials: 'include' // This is CRUCIAL for sending the session cookie
        });
        if (response.status === 401) {
            window.location.href = 'login.html'; // Redirect to login page
            return;
        }
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            document.getElementById("total-properties").textContent = data.totalProperties;
            document.getElementById("active-listings").textContent = data.activeListings;
            document.getElementById("unread-messages").textContent = data.unreadMessages;
            document.getElementById("monthly-views").textContent = data.totalViews;
        } else {
            showNotification(`Failed to fetch summary data: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error("Error fetching summary data:", error);
        showNotification("Failed to connect to the server.", 'error');
    }
}

// Function to fetch recent activity
async function fetchRecentActivity() {
    const activityList = document.getElementById("activity-list");
    activityList.innerHTML = '<p class="loading-message">Loading activity...</p>';
    try {
        const response = await fetch(`${API_BASE_URL}/seller/activity`, {
            credentials: 'include' // This is CRUCIAL for sending the session cookie
        });
        if (response.status === 401) {
            window.location.href = 'login.html'; // Redirect to login page
            return;
        }
        const result = await response.json();

        if (result.success) {
            activityList.innerHTML = ''; // Clear loading message
            if (result.data.length > 0) {
                result.data.forEach(activity => {
                    const activityItem = document.createElement('div');
                    activityItem.className = 'activity-item';
                    activityItem.innerHTML = `
                        <div class="activity-icon">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${activity.title}</h4>
                            <p>${activity.message}</p>
                        </div>
                        <div class="activity-time">
                            ${new Date(activity.timestamp).toLocaleString()}
                        </div>
                    `;
                    activityList.appendChild(activityItem);
                });
            } else {
                activityList.innerHTML = '<p class="no-data">No recent activity to display.</p>';
            }
        } else {
            activityList.innerHTML = `<p class="error-message">Error: ${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        activityList.innerHTML = `<p class="error-message">Failed to load activity. Network error.</p>`;
    }
}

// Function to update the welcome message and current time
function updateHeader() {
    const hours = new Date().getHours();
    let welcomeMessage = "Welcome back!";
    if (hours < 12) {
        welcomeMessage = "Good morning!";
    } else if (hours < 18) {
        welcomeMessage = "Good afternoon!";
    } else {
        welcomeMessage = "Good evening!";
    }
    document.getElementById("welcome-message").textContent = welcomeMessage;

    const currentTimeElement = document.getElementById("current-time");
    function updateTime() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        currentTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
    updateTime();
    setInterval(updateTime, 60000);
}

// Check session on page load and initialize dashboard
async function initializeDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/session`, {
            credentials: 'include' // Crucial for session check
        });
        const result = await response.json();

        if (result.loggedIn) {
            updateHeader();
            fetchSummaryData();
            fetchRecentActivity();
        } else {
            // Redirect to login page if not authenticated
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Session check error:", error);
        showNotification("Failed to connect to the authentication server.", 'error');
        window.location.href = 'login.html';
    }
}

document.addEventListener("DOMContentLoaded", initializeDashboard);

window.refreshActivity = fetchRecentActivity;