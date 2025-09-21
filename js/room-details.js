const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");
console.log("Room ID:", roomId);

// Global variables
let userId = null;
let currentImageIndex = 0;
let isSaved = false;
let isMessageUnlocked = false;
let isMapUnlocked = false;
let roomData = null; // Will store actual room data from API

// Initialize the page when DOM loads
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Initializing page...");
  
  try {
    // First check user session
    await checkUserSession();
    
    // Then load room data and initialize everything
    await loadRoomData();
    
    // Setup UI after data is loaded
    setupEventListeners();
    initializeScrollAnimations();
    initializeAdvancedAnimations();
    
  } catch (error) {
    console.error("Page initialization error:", error);
    showToast('Failed to load page', 'error');
  }
});

// Check user session status
async function checkUserSession() {
  console.log("Checking session status...");

  try {
    const res = await fetch("http://localhost:5000/api/user/session", {
      credentials: "include"
    });
    const data = await res.json();
    console.log("Session data:", data);

    userId = data.loggedIn ? data.user.id : null;
  } catch (err) {
    console.error("Error during session check:", err);
    userId = null;
  }
}

// Load room data from API
async function loadRoomData() {
  try {
    const res = await fetch(`http://localhost:5000/api/room/${roomId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    roomData = await res.json();
    console.log("Room Data:", roomData);
    
    // Load room details into the UI
    updateRoomDetails();
    
    // Initialize components with actual data
    initializeCarousel();
    loadAmenities();
    loadProsAndCons();
    loadGallery();
    
    // Load saved status after room data is loaded
    await loadSavedStatus();
    
    // Load other unlock states from localStorage
    loadLocalStorageStates();
    
    // Update all button states
    updateAllButtons();
    
    // Add animate class to make elements visible
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      el.classList.add('animate');
    });
    
  } catch (err) {
    console.error("Failed to load room data:", err);
    showToast('Failed to load room details', 'error');
  }
}

// Update room details in UI
function updateRoomDetails() {
  if (!roomData) return;
  
  document.getElementById('roomTitle').textContent = roomData.title;
  document.getElementById('roomTitle').style.borderRight = 'none';
  document.getElementById('roomLocation').textContent = roomData.location.AREA + "," + roomData.location.DISTRICT;
  document.getElementById('roomRent').textContent = `৳${roomData.rent}/month`;
  document.getElementById('roomDescription').textContent = roomData.description;
  document.getElementById('roomStatus').textContent = roomData.status;
  document.getElementById('ownerName').textContent = `Owner: ${roomData.seller.name}`;
  document.getElementById('mapLocation').textContent = roomData.location.AREA + "," + roomData.location.DISTRICT;
  document.getElementById('lockLocation').textContent = roomData.location.AREA + "," + roomData.location.DISTRICT;
}

// Load saved status from API
async function loadSavedStatus() {
  if (!userId || !roomId) {
    isSaved = false;
    return;
  }

  try {
    const res = await fetch(`http://localhost:5000/api/savedroom/${roomId}/${userId}`, {
      credentials: "include"
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("Saved Room Details:", data);
      isSaved = data.isSaved;
    } else {
      console.error("Failed to load saved status");
      isSaved = false;
    }
  } catch (err) {
    console.error("Error loading saved status:", err);
    isSaved = false;
  }
}

// Load other states from localStorage (for unlocks)
function loadLocalStorageStates() {
  // Load unlock states (these are premium features stored locally)
  const unlockedMessages = JSON.parse(localStorage.getItem('unlockedMessages') || '[]');
  isMessageUnlocked = unlockedMessages.includes(roomId);
  
  const unlockedMaps = JSON.parse(localStorage.getItem('unlockedMaps') || '[]');
  isMapUnlocked = unlockedMaps.includes(roomId);
}

// Update all button states
function updateAllButtons() {
  updateSaveButton();
  updateMessageButton();
  updateMapSection();
}

// Initialize carousel
function initializeCarousel() {
  if (!roomData || !roomData.images) return;

  const carouselImages = document.getElementById('carouselImages');
  const carouselDots = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (!carouselImages || !carouselDots) return;
  
  carouselImages.innerHTML = '';
  carouselDots.innerHTML = '';
  
  // Parse images if it's a string
  const imageArray = typeof roomData.images === 'string' ? JSON.parse(roomData.images) : roomData.images;
  
  imageArray.forEach((image, index) => {
    // Add image to carousel
    const img = document.createElement('img');
    img.src = `http://localhost:5500/backend/selleruploads/${image}`;
    img.alt = `Room image ${index + 1}`;
    img.className = 'carousel-image';
    carouselImages.appendChild(img);
    
    // Add dot for carousel navigation
    const dot = document.createElement('div');
    dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(index));
    carouselDots.appendChild(dot);
  });

  // Hide navigation if only one image
  if (imageArray.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    carouselDots.style.display = 'none';
  } else {
    if (prevBtn) prevBtn.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'block';
    carouselDots.style.display = 'flex';
  }

  currentImageIndex = 0;
  updateCarousel();
}

// Load amenities
function loadAmenities() {
  if (!roomData || !roomData.amenities) return;
  
  const amenitiesGrid = document.getElementById('amenitiesGrid');
  if (!amenitiesGrid) return;
  
  amenitiesGrid.innerHTML = '';
  roomData.amenities.forEach((amenity, index) => {
    const amenityItem = document.createElement('div');
    amenityItem.className = 'amenity-item';
    amenityItem.innerHTML = `
      <i class="fas fa-check"></i>
      <span>${amenity}</span>
    `;
    amenitiesGrid.appendChild(amenityItem);
  });
}

// Load pros and cons
function loadProsAndCons() {
  if (!roomData) return;
  
  // Load pros if they exist
  if (roomData.pros) {
    const prosList = document.getElementById('prosList');
    if (prosList) {
      prosList.innerHTML = '';
      roomData.pros.forEach(pro => {
        const prosItem = document.createElement('div');
        prosItem.className = 'pros-item';
        prosItem.innerHTML = `
          <i class="fas fa-check-circle"></i>
          <span>${pro}</span>
        `;
        prosList.appendChild(prosItem);
      });
    }
  }

  // Load cons if they exist
  if (roomData.cons) {
    const consList = document.getElementById('consList');
    if (consList) {
      consList.innerHTML = '';
      roomData.cons.forEach(con => {
        const consItem = document.createElement('div');
        consItem.className = 'cons-item';
        consItem.innerHTML = `
          <i class="fas fa-times-circle"></i>
          <span>${con}</span>
        `;
        consList.appendChild(consItem);
      });
    }
  }
}

// Load gallery
function loadGallery() {
  if (!roomData || !roomData.images) return;

  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;
  
  galleryGrid.innerHTML = '';
  
  // Parse images if it's a string
  const imageArray = typeof roomData.images === 'string' ? JSON.parse(roomData.images) : roomData.images;
  
  imageArray.forEach((image, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item animate-on-scroll';
    galleryItem.innerHTML = `
      <img src="http://localhost:5500/backend/selleruploads/${image}" 
          alt="Gallery image ${index + 1}" 
          class="gallery-image">
      <div class="gallery-overlay">
          <i class="fas fa-search-plus"></i>
      </div>
    `;
    
    // Add click event for lightbox
    galleryItem.addEventListener('click', () => {
      const lightboxModal = document.getElementById('lightboxModal');
      const lightboxImage = document.getElementById('lightboxImage');
      if (lightboxModal && lightboxImage) {
        lightboxImage.src = `http://localhost:5500/backend/selleruploads/${image}`;
        lightboxModal.classList.add('active');
      }
    });
    
    galleryGrid.appendChild(galleryItem);
  });
}

function setupEventListeners() {
  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIcon = document.getElementById('menuIcon');
  
  if (mobileMenuBtn && mobileMenu && menuIcon) {
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      if (mobileMenu.classList.contains('active')) {
        menuIcon.className = 'fas fa-times';
      } else {
        menuIcon.className = 'fas fa-bars';
      }
    });
  }
  
  // Carousel controls
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  
  // Action buttons
  const saveBtn = document.getElementById('saveBtn');
  const messageBtn = document.getElementById('messageBtn');
  const unlockMapBtn = document.getElementById('unlockMapBtn');
  
  if (saveBtn) saveBtn.addEventListener('click', toggleSaveRoom);
  if (messageBtn) messageBtn.addEventListener('click', handleMessageAction);
  if (unlockMapBtn) unlockMapBtn.addEventListener('click', unlockMap);
  
  // Lightbox
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxModal = document.getElementById('lightboxModal');
  
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeLightbox();
      }
    });
  }
  
  // Auto-advance carousel
  setInterval(nextSlide, 5000);
}

// Carousel functions
function nextSlide() {
  const imageCount = document.querySelectorAll('.carousel-image').length;
  if (imageCount > 1) {
    currentImageIndex = (currentImageIndex + 1) % imageCount;
    updateCarousel();
  }
}

function prevSlide() {
  const imageCount = document.querySelectorAll('.carousel-image').length;
  if (imageCount > 1) {
    currentImageIndex = (currentImageIndex - 1 + imageCount) % imageCount;
    updateCarousel();
  }
}

function goToSlide(index) {
  currentImageIndex = index;
  updateCarousel();
}

function updateCarousel() {
  const carouselImages = document.getElementById('carouselImages');
  const dots = document.querySelectorAll('.carousel-dot');
  
  if (!carouselImages) return;
  
  // Only update if there are multiple images
  if (dots.length > 1) {
    // Update image position
    const translateX = -currentImageIndex * 100;
    carouselImages.style.transform = `translateX(${translateX}%)`;
    
    // Update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentImageIndex);
    });
  } else {
    // Reset transform for single image
    carouselImages.style.transform = 'none';
  }
}

// FIXED SAVE ROOM FUNCTIONALITY
async function toggleSaveRoom() {
  // Check if user is logged in
  if (!userId) {
    showToast('Please login to save rooms', 'error');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  if (!saveBtn) return;
  
  try {
    saveBtn.disabled = true; // Prevent multiple clicks
    
    if (isSaved) {
      // Remove from saved - call DELETE API
      const response = await fetch(`http://localhost:5000/api/savedroom/${roomId}/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        isSaved = false;
        showToast('Room removed from saved list', 'success');
      } else {
        throw new Error('Failed to remove from saved');
      }
    } else {
      // Add to saved - call POST API
      const response = await fetch(`http://localhost:5000/api/savedroom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          room_id: parseInt(roomId),
          user_id: parseInt(userId)
        })
      });
      
      if (response.ok) {
        isSaved = true;
        showToast('Room saved successfully!', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save room');
      }
    }
    
    updateSaveButton();
    
  } catch (error) {
    console.error('Save room error:', error);
    showToast(error.message || 'Failed to update saved status', 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

function updateSaveButton() {
  const saveBtn = document.getElementById('saveBtn');
  const saveIcon = document.getElementById('saveIcon');
  const saveText = document.getElementById('saveText');
  
  if (!saveBtn || !saveIcon || !saveText) return;
  
  if (isSaved) {
    saveBtn.classList.add('saved');
    saveIcon.classList.add('fas');
    saveIcon.classList.remove('far');
    saveText.textContent = 'Saved';
  } else {
    saveBtn.classList.remove('saved');
    saveIcon.classList.remove('fas');
    saveIcon.classList.add('far');
    saveText.textContent = 'Save Room';
  }
}

// Message functionality
function handleMessageAction() {
  if (isMessageUnlocked) {
    showToast('Message sent to owner!', 'success');
  } else {
    const confirmed = confirm('Unlock messaging with owner for à§³100?');
    if (confirmed) {
      const unlockedMessages = JSON.parse(localStorage.getItem('unlockedMessages') || '[]');
      unlockedMessages.push(roomId);
      localStorage.setItem('unlockedMessages', JSON.stringify(unlockedMessages));
      isMessageUnlocked = true;
      updateMessageButton();
      showToast('Messaging unlocked! You can now contact the owner.', 'success');
    }
  }
}

function updateMessageButton() {
  const messageBtn = document.getElementById('messageBtn');
  const messageText = document.getElementById('messageText');
  
  if (!messageBtn || !messageText) return;
  
  if (isMessageUnlocked) {
    messageBtn.classList.add('unlocked');
    messageText.textContent = 'Send Message';
  } else {
    messageBtn.classList.remove('unlocked');
    messageText.textContent = 'Unlock Message (à§³100)';
  }
}

// Map functionality
function unlockMap() {
  const confirmed = confirm('Unlock the exact location for à§³100?');
  if (confirmed) {
    const unlockedMaps = JSON.parse(localStorage.getItem('unlockedMaps') || '[]');
    unlockedMaps.push(roomId);
    localStorage.setItem('unlockedMaps', JSON.stringify(unlockedMaps));
    isMapUnlocked = true;
    updateMapSection();
    showToast('Location unlocked! You can now view the exact location.', 'success');
  }
}

function updateMapSection() {
  const mapLocked = document.getElementById('mapLocked');
  const mapUnlocked = document.getElementById('mapUnlocked');
  const statusIndicator = document.getElementById('statusIndicator');
  
  if (!mapLocked || !mapUnlocked || !statusIndicator) return;
  
  if (isMapUnlocked) {
    mapLocked.classList.add('hidden');
    mapUnlocked.classList.remove('hidden');
    statusIndicator.innerHTML = '<i class="fas fa-unlock"></i><span>Unlocked</span>';
    statusIndicator.classList.add('unlocked');
  } else {
    mapLocked.classList.remove('hidden');
    mapUnlocked.classList.add('hidden');
    statusIndicator.innerHTML = '<i class="fas fa-lock"></i><span>Locked</span>';
    statusIndicator.classList.remove('unlocked');
  }
}

// Gallery lightbox functionality
function openLightbox(imageSrc) {
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImage = document.getElementById('lightboxImage');
  
  if (!lightboxModal || !lightboxImage) return;
  
  lightboxImage.src = imageSrc;
  lightboxModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightboxModal = document.getElementById('lightboxModal');
  if (!lightboxModal) return;
  
  lightboxModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  if (!toast || !toastIcon || !toastMessage) {
    console.log(message); // Fallback to console if toast elements not found
    return;
  }
  
  // Set icon based on type
  toastIcon.className = `toast-icon ${type}`;
  switch (type) {
    case 'success':
      toastIcon.classList.add('fas', 'fa-check-circle');
      break;
    case 'error':
      toastIcon.classList.add('fas', 'fa-exclamation-circle');
      break;
    default:
      toastIcon.classList.add('fas', 'fa-info-circle');
  }
  
  toastMessage.textContent = message;
  
  // Show toast
  toast.classList.add('show');
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Scroll Animation Observer
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate');
        
        // Add staggered animation for child elements
        const children = entry.target.querySelectorAll('.amenity-item, .pros-item, .cons-item, .gallery-item');
        children.forEach((child, index) => {
          setTimeout(() => {
            child.style.opacity = '1';
            child.style.transform = 'translateY(0)';
          }, index * 100);
        });
      }
    });
  }, observerOptions);

  // Observe all elements with animation classes
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  animatedElements.forEach(el => observer.observe(el));
}

// Advanced Animations
function initializeAdvancedAnimations() {
  // Parallax scroll effect for background
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxBg = document.querySelector('.gradient-background');
    if (parallaxBg) {
      parallaxBg.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
  });

  // Add magnetic effect to buttons
  const buttons = document.querySelectorAll('.save-btn, .message-btn, .unlock-btn');
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.02)`;
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });

  // Add floating animation to carousel
  const carousel = document.getElementById('imageCarousel');
  if (carousel) {
    setInterval(() => {
      carousel.style.transform = `translateY(${Math.sin(Date.now() * 0.001) * 5}px)`;
    }, 16);
  }
}