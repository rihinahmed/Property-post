// Global Variables
let currentStep = 0;
let roomData = {
  title: '',
  location: '',
  rent: '',
  description: '',
  amenities: [],
  pros: [],
  cons: [],
  images: [],
  latitude: null,
  longitude: null
};

let map = null;
let marker = null;
let mapLoaded = false;

const steps = [
  { title: 'Basic Info', icon: 'fas fa-home' },
  { title: 'Details', icon: 'fas fa-file-text' },
  { title: 'Photos', icon: 'fas fa-image' },
  { title: 'Location', icon: 'fas fa-map-marker-alt' }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  updateStepDisplay();
  updateProgressBar();
});

// Event Listeners
function initializeEventListeners() {
  // File input
  document.getElementById('file-input').addEventListener('change', handleImageUpload);
  
  // Enter key handlers for adding items
  document.getElementById('new-amenity').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAmenity();
    }
  });
  
  document.getElementById('new-pro').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addPro();
    }
  });
  
  document.getElementById('new-con').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCon();
    }
  });
  
  // Input change handlers
  document.getElementById('room-title').addEventListener('input', function(e) {
    roomData.title = e.target.value;
  });
  
  document.getElementById('room-rent').addEventListener('input', function(e) {
    roomData.rent = e.target.value;
  });
  
  document.getElementById('room-description').addEventListener('input', function(e) {
    roomData.description = e.target.value;
  });
  
  document.getElementById('room-location').addEventListener('input', function(e) {
    roomData.location = e.target.value;
  });
}

// Step Navigation
function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep < steps.length - 1) {
      currentStep++;
      updateStepDisplay();
      updateProgressBar();
      
      if (currentStep === 3) {
        loadGoogleMaps();
      }
    }
  }
}

function previousStep() {
  if (currentStep > 0) {
    currentStep--;
    updateStepDisplay();
    updateProgressBar();
  }
}

function updateStepDisplay() {
  // Update step content visibility
  document.querySelectorAll('.step-content').forEach((content, index) => {
    content.classList.toggle('active', index === currentStep);
  });
  
  // Update step title
  document.getElementById('step-title').textContent = steps[currentStep].title;
  
  // Update step indicators
  document.querySelectorAll('.step-item').forEach((item, index) => {
    item.classList.remove('active', 'completed');
    if (index === currentStep) {
      item.classList.add('active');
    } else if (index < currentStep) {
      item.classList.add('completed');
      item.querySelector('.step-circle').innerHTML = '<i class="fas fa-check"></i>';
    } else {
      const iconClass = steps[index].icon;
      item.querySelector('.step-circle').innerHTML = `<i class="${iconClass}"></i>`;
    }
  });
  
  // Update navigation buttons
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const submitBtn = document.getElementById('submit-btn');
  
  prevBtn.disabled = currentStep === 0;
  
  if (currentStep === steps.length - 1) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'flex';
  } else {
    nextBtn.style.display = 'flex';
    submitBtn.style.display = 'none';
  }
}

function updateProgressBar() {
  const progressFill = document.getElementById('progress-fill');
  const progress = ((currentStep + 1) / steps.length) * 100;
  progressFill.style.width = `${progress}%`;
}

// Validation
function validateCurrentStep() {
  switch (currentStep) {
    case 0:
      if (!roomData.title.trim()) {
        showToast('Please enter a room title', 'error');
        return false;
      }
      if (!roomData.rent.trim()) {
        showToast('Please enter the monthly rent', 'error');
        return false;
      }
      break;
    case 2:
      if (roomData.images.length === 0) {
        showToast('Please upload at least one image', 'error');
        return false;
      }
      break;
    case 3:
      if (!roomData.location.trim()) {
        showToast('Please enter a location', 'error');
        return false;
      }
      break;
  }
  return true;
}

// List Item Management
function addAmenity() {
  const input = document.getElementById('new-amenity');
  const value = input.value.trim();
  if (value) {
    roomData.amenities.push(value);
    input.value = '';
    renderTags('amenities', roomData.amenities, 'amenities-container');
  }
}

function addPro() {
  const input = document.getElementById('new-pro');
  const value = input.value.trim();
  if (value) {
    roomData.pros.push(value);
    input.value = '';
    renderTags('pros', roomData.pros, 'pros-container', 'pro');
  }
}

function addCon() {
  const input = document.getElementById('new-con');
  const value = input.value.trim();
  if (value) {
    roomData.cons.push(value);
    input.value = '';
    renderTags('cons', roomData.cons, 'cons-container', 'con');
  }
}

function renderTags(field, items, containerId, className = '') {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  items.forEach((item, index) => {
    const tag = document.createElement('div');
    tag.className = `tag ${className}`;
    tag.innerHTML = `
      ${item}
      <button type="button" class="remove-btn" onclick="removeItem('${field}', ${index})">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(tag);
  });
}

function removeItem(field, index) {
  roomData[field].splice(index, 1);
  
  let containerName = field + '-container';
  let className = '';
  
  if (field === 'pros') {
    className = 'pro';
  } else if (field === 'cons') {
    className = 'con';
  }
  
  renderTags(field, roomData[field], containerName, className);
}

// Image Upload
function triggerFileInput() {
  document.getElementById('file-input').click();
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files);
  
  if (files.length + roomData.images.length > 10) {
    showToast('Maximum 10 images allowed', 'error');
    return;
  }
  
  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      roomData.images.push(file);
      const reader = new FileReader();
      reader.onload = function(e) {
        addImageToGrid(e.target.result, roomData.images.length - 1);
      };
      reader.readAsDataURL(file);
    }
  });
  
  updateImageCounter();
  showToast(`${files.length} image(s) uploaded successfully!`, 'success');
  
  // Reset input
  event.target.value = '';
}

function addImageToGrid(src, index) {
  const grid = document.getElementById('images-grid');
  const imageItem = document.createElement('div');
  imageItem.className = 'image-item';
  imageItem.innerHTML = `
    <img src="${src}" alt="Room photo ${index + 1}">
    <button type="button" class="image-remove" onclick="removeImage(${index})">
      <i class="fas fa-times"></i>
    </button>
  `;
  grid.appendChild(imageItem);
}

function removeImage(index) {
  roomData.images.splice(index, 1);
  
  // Rebuild the grid
  const grid = document.getElementById('images-grid');
  grid.innerHTML = '';
  
  roomData.images.forEach((file, newIndex) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      addImageToGrid(e.target.result, newIndex);
    };
    reader.readAsDataURL(file);
  });
  
  updateImageCounter();
}

function updateImageCounter() {
  const counter = document.getElementById('image-counter');
  counter.textContent = `${roomData.images.length}/10 photos uploaded`;
}

// Google Maps
function loadGoogleMaps() {
  if (mapLoaded) {
    return;
  }
  
  if (window.google && window.google.maps) {
    initMap();
  } else {
    // Map will be initialized via callback when script loads
  }
}

function initMap() {
  if (mapLoaded) return;
  
  const mapContainer = document.getElementById('map-container');
  const loadingText = document.getElementById('loading-text');
  
  try {
    map = new google.maps.Map(mapContainer, {
      center: { lat: 23.8103, lng: 90.4125 }, // Dhaka, Bangladesh
      zoom: 13,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#2c5364' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#0f2027' }]
        }
      ]
    });
    
    // Add click listener
    map.addListener('click', function(event) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Remove existing marker
      if (marker) {
        marker.setMap(null);
      }
      
      // Add new marker
      marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        title: 'Room Location'
      });
      
      roomData.latitude = lat;
      roomData.longitude = lng;
      
      // Get address from coordinates
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: lat, lng: lng } }, function(results, status) {
        if (status === 'OK' && results[0]) {
          roomData.location = results[0].formatted_address;
          document.getElementById('room-location').value = roomData.location;
        }
      });
      
      // Show coordinates
      const locationSelected = document.getElementById('location-selected');
      const coordinatesDisplay = document.getElementById('coordinates-display');
      coordinatesDisplay.textContent = `Location selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      locationSelected.style.display = 'flex';
      
      showToast('Location selected successfully!', 'success');
    });
    
    loadingText.style.display = 'none';
    mapLoaded = true;
    
  } catch (error) {
    console.error('Error initializing map:', error);
    loadingText.textContent = 'Error loading map';
  }
}

// Form Submission
function submitForm() {
  // Get current values
  roomData.title = document.getElementById('room-title').value;
  roomData.rent = document.getElementById('room-rent').value;
  roomData.description = document.getElementById('room-description').value;
  roomData.location = document.getElementById('room-location').value;
  
  // Validate
  if (!roomData.title.trim() || !roomData.location.trim() || !roomData.rent.trim()) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  if (roomData.images.length === 0) {
    showToast('Please upload at least one image', 'error');
    return;
  }
  
  // Here you would typically send the data to your backend
  console.log('Room data to submit:', roomData);
  
  showToast('Room posted successfully!', 'success');
  
  // Reset form after delay
  setTimeout(() => {
    resetForm();
  }, 2000);
}

function resetForm() {
  // Reset data
  roomData = {
    title: '',
    location: '',
    rent: '',
    description: '',
    amenities: [],
    pros: [],
    cons: [],
    images: [],
    latitude: null,
    longitude: null
  };
  
  // Reset form inputs
  document.getElementById('room-title').value = '';
  document.getElementById('room-rent').value = '';
  document.getElementById('room-description').value = '';
  document.getElementById('room-location').value = '';
  document.getElementById('new-amenity').value = '';
  document.getElementById('new-pro').value = '';
  document.getElementById('new-con').value = '';
  
  // Clear containers
  document.getElementById('amenities-container').innerHTML = '';
  document.getElementById('pros-container').innerHTML = '';
  document.getElementById('cons-container').innerHTML = '';
  document.getElementById('images-grid').innerHTML = '';
  updateImageCounter();
  
  // Hide location selected
  document.getElementById('location-selected').style.display = 'none';
  
  // Remove marker
  if (marker) {
    marker.setMap(null);
    marker = null;
  }
  
  // Reset to first step
  currentStep = 0;
  updateStepDisplay();
  updateProgressBar();
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    ${message}
    <button class="toast-close" onclick="removeToast(this.parentElement)">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      removeToast(toast);
    }
  }, 5000);
}

function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

// Google Maps callback (called when Maps API loads)
window.initMap = function() {
  if (currentStep === 3) {
    initMap();
  }
};

// Update form data as user types
function updateFormData() {
  roomData.title = document.getElementById('room-title').value;
  roomData.rent = document.getElementById('room-rent').value;
  roomData.description = document.getElementById('room-description').value;
  roomData.location = document.getElementById('room-location').value;
}

// Add event listeners for real-time updates
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('room-title').addEventListener('input', updateFormData);
  document.getElementById('room-rent').addEventListener('input', updateFormData);
  document.getElementById('room-description').addEventListener('input', updateFormData);
  document.getElementById('room-location').addEventListener('input', updateFormData);
});