// js/saved.js

const API_BASE_URL = "http://localhost:5000/api";

let currentRooms = [];
let lastRemoved = null;

// Function to show a notification toast
function showUndoToast() {
    const toast = document.getElementById("undoToast");
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 4000);
}

// Function to render the rooms on the page
function renderRooms() {
    const grid = document.getElementById("savedGrid");
    grid.innerHTML = "";

    if (currentRooms.length === 0) {
        grid.innerHTML = '<p class="no-data-message">You have no saved rooms yet.</p>';
        return;
    }

    currentRooms.forEach(room => {
        const card = document.createElement("div");
        card.className = "saved-card";
        card.innerHTML = `
            <img src="${room.IMAGE_URL}" alt="Room">
            <div class="saved-info">
                <h3>${room.TITLE}</h3>
                <p>${room.DESCRIPTION}</p>
                <div class="saved-meta">
                    <span>📍 ${room.LOCATION}</span>
                    <span>৳ ${room.PRICE.toLocaleString()}/mo</span>
                </div>
                <button class="unsave-btn" onclick="removeRoom(${room.ID})">💔 Remove</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Function to fetch saved rooms from the backend
async function fetchSavedRooms() {
    const savedGrid = document.getElementById('savedGrid');
    savedGrid.innerHTML = '<p class="loading-message">Loading saved rooms...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/saved`, {
            credentials: 'include'
        });
        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        const result = await response.json();
        
        if (result.success) {
            currentRooms = result.data || [];
            renderRooms();
        } else {
            savedGrid.innerHTML = `<p class="error-message">Failed to load saved rooms: ${result.message}</p>`;
        }
    } catch (error) {
        console.error("Error fetching saved rooms:", error);
        savedGrid.innerHTML = '<p class="error-message">Failed to connect to the server.</p>';
    }
}

// Function to remove a room and notify the backend
async function removeRoom(id) {
    lastRemoved = currentRooms.find(r => r.ID === id);
    currentRooms = currentRooms.filter(r => r.ID !== id);
    renderRooms();
    showUndoToast();

    try {
        const response = await fetch(`${API_BASE_URL}/rooms/saved/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const result = await response.json();

        if (!result.success) {
            console.error("Failed to remove room from server:", result.message);
            // If the server operation fails, re-add the room to the frontend
            currentRooms.push(lastRemoved);
            renderRooms();
            alert("Failed to remove room. Please try again.");
        }
    } catch (error) {
        console.error("Network error during room removal:", error);
        // If the server operation fails, re-add the room to the frontend
        currentRooms.push(lastRemoved);
        renderRooms();
        alert("Network error. Please check your connection.");
    }
}

// Function to undo room removal
function undoRemove() {
    if (lastRemoved) {
        // Since the backend DELETE succeeded, we need to re-add the room.
        // This would require a new backend endpoint, e.g., POST /api/rooms/saved
        alert("The undo feature requires a backend endpoint to re-save the room.");
        lastRemoved = null; // Clear the state
        document.getElementById("undoToast").style.display = "none";
        // For a full implementation, you would make a POST request here
    }
}

// Function to sort rooms
function sortRooms() {
    const value = this.value;
    if (value === "location") {
        currentRooms.sort((a, b) => a.LOCATION.localeCompare(b.LOCATION));
    } else if (value === "priceLow") {
        currentRooms.sort((a, b) => a.PRICE - b.PRICE);
    } else if (value === "priceHigh") {
        currentRooms.sort((a, b) => b.PRICE - a.PRICE);
    }
    renderRooms();
}

// Function to check session and load the page
async function checkSessionAndLoadPage() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/session`, {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.loggedIn) {
            fetchSavedRooms();
        } else {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Session check failed:", error);
        window.location.href = 'login.html';
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", checkSessionAndLoadPage);
document.getElementById("sortOptions").addEventListener("change", sortRooms);
document.getElementById("themeToggle").onclick = () => {
    document.body.classList.toggle("dark");
};