// Global variables
let userId = null;
let currentRooms = [];
let lastRemoved = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await checkUserSession();
    if (userId) {
      await loadSavedProperties();
    } else {
      showNoUserMessage();
    }
    setupEventListeners();
  } catch (error) {
    console.error("Page initialization error:", error);
    showError("Failed to load saved properties");
  }
});

// Check user session
async function checkUserSession() {
  try {
    const res = await fetch("http://localhost:5000/api/user/session", {
      credentials: "include"
    });
    const data = await res.json();
    console.log("Session data:", data);
    userId = data.loggedIn ? data.user.id : null;
  } catch (err) {
    console.error("Session check error:", err);
    userId = null;
  }
}

// Load saved properties from API
async function loadSavedProperties() {
  try {
    const res = await fetch(`http://localhost:5000/api/user-saved-properties/user/${userId}`, {
      credentials: "include"
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Saved properties data:", data);
    
    currentRooms = data.savedProperties || [];
    renderRooms();
    
  } catch (err) {
    console.error("Failed to load saved properties:", err);
    showError("Failed to load saved properties");
  }
}

// Helper function to get valid image URL
function getImageUrl(room) {
  // Check if room has images array and it's not empty
  if (room.images && Array.isArray(room.images) && room.images.length > 0) {
    // Get the first image and ensure it's a valid string
    const firstImage = room.images[0];
    if (firstImage && typeof firstImage === 'string' && firstImage.trim() !== '') {
      return `http://localhost:5000/backend/selleruploads/${firstImage.trim()}`;
    }
  }
  
  // Fallback to placeholder image
  return "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1171";
}

// Handle image load errors
function handleImageError(imgElement) {
  imgElement.onerror = null; // Prevent infinite loop
  imgElement.src = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1171";
}

// Render rooms to the grid
function renderRooms() {
  const grid = document.getElementById("savedGrid");
  
  if (!grid) {
    console.error("savedGrid element not found");
    return;
  }
  
  grid.innerHTML = "";
  
  if (currentRooms.length === 0) {
    grid.innerHTML = `
      <div class="no-saved-rooms">
        <h2>No Saved Properties Yet</h2>
        <p>Start exploring and save properties you like!</p>
        <a href="/rooms" class="explore-btn">Explore Properties</a>
      </div>
    `;
    return;
  }

  currentRooms.forEach(room => {
    const card = document.createElement("div");
    card.className = "saved-card";
    
    // Get image URL with proper handling
    const imageUrl = getImageUrl(room);
    
    // Format description to limit length
    const shortDesc = room.description && room.description.length > 100 
      ? room.description.substring(0, 100) + "..."
      : room.description || "No description available";
    
    // Debug log for images
    console.log(`Room ${room.id} images:`, room.images);
    console.log(`Image URL for room ${room.id}:`, imageUrl);
    
    card.innerHTML = `
      <img src="${imageUrl}" alt="Property" onload="console.log('Image loaded: ${imageUrl}')" onerror="handleImageError(this)">
      <div class="saved-info">
        <h3>${room.title || 'Untitled Property'}</h3>
        <p>${room.status}</p>
        <p>${shortDesc}</p>
        
        <div class="saved-meta">
          <span>📍 ${room.location}</span>
          <span>৳ ${room.price ? room.price.toLocaleString() : 'N/A'}/mo</span>
        </div>
        
        <div class="saved-actions">
          <button class="view-btn" onclick="viewProperty(${room.id})">👁️ View</button>
          <button class="unsave-btn" onclick="removeProperty(${room.id})">💔 Remove</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// View property details
function viewProperty(propertyId) {
  window.open(`/room-details?id=${propertyId}`, '_blank');
}

// Remove property from saved
async function removeProperty(propertyId) {
  try {
    // Find the property to store for undo
    lastRemoved = currentRooms.find(r => r.id === propertyId);
    
    // Call API to remove from database
    const response = await fetch(`http://localhost:5000/api/user-saved-properties/remove/${propertyId}/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove property');
    }
    
    // Remove from current rooms array
    currentRooms = currentRooms.filter(r => r.id !== propertyId);
    renderRooms();
    showUndo();
    
  } catch (error) {
    console.error("Remove property error:", error);
    showError("Failed to remove property from saved list");
    lastRemoved = null;
  }
}

// Show undo toast
function showUndo() {
  const toast = document.getElementById("undoToast");
  if (toast) {
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 4000);
  }
}

// Undo remove action
async function undoRemove() {
  if (!lastRemoved) return;
  
  try {
    // Call API to save property again
    const response = await fetch(`http://localhost:5000/api/user-saved-properties/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        room_id: lastRemoved.id,
        user_id: userId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to restore property');
    }
    
    // Add back to current rooms
    currentRooms.push(lastRemoved);
    lastRemoved = null;
    renderRooms();
    
    // Hide undo toast
    const toast = document.getElementById("undoToast");
    if (toast) {
      toast.style.display = "none";
    }
    
    showSuccess("Property restored to saved list");
    
  } catch (error) {
    console.error("Undo remove error:", error);
    showError("Failed to restore property");
  }
}

// Setup event listeners
function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.onclick = () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    };
  }
  
  // Load saved theme
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
  }
  
  // Sort options
  const sortOptions = document.getElementById("sortOptions");
  if (sortOptions) {
    sortOptions.onchange = function () {
      const value = this.value;
      if (value === "location") {
        currentRooms.sort((a, b) => a.location.localeCompare(b.location));
      } else if (value === "priceLow") {
        currentRooms.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (value === "priceHigh") {
        currentRooms.sort((a, b) => (b.price || 0) - (a.price || 0));
      }
      renderRooms();
    };
  }
}

// Show no user message
function showNoUserMessage() {
  const grid = document.getElementById("savedGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="no-user-message">
        <h2>Please Login</h2>
        <p>You need to be logged in to view your saved properties.</p>
        <a href="/login" class="login-btn">Login</a>
      </div>
    `;
  }
}

// Show error message
function showError(message) {
  const grid = document.getElementById("savedGrid");
  if (grid) {
    grid.innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()" class="retry-btn">Try Again</button>
      </div>
    `;
  }
}

// Show success message (you can enhance this with a toast)
function showSuccess(message) {
  console.log("Success:", message);
  // You can implement a success toast here if needed
}

// Make functions globally available
window.handleImageError = handleImageError;
window.undoRemove = undoRemove;