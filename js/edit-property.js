// app.js

// Global state
let formData = {};
let images = [];
let currentPropertyId = null;

// API Configuration
const API_URL = "http://localhost:5000/api/property";

// --- Particle and Floating Shape Classes (Your original code, unmodified) ---

// Enhanced particle system
let particles = [];
let animationFrame;

// Particle class with physics
class MovingParticle {
    constructor() {
        this.x = Math.random() * 100;
        this.y = Math.random() * 100;
        this.size = Math.random() * 6 + 2;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.element = null;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        this.createElement();
    }
    
    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'particle';
        this.element.style.cssText = `
            left: ${this.x}%;
            top: ${this.y}%;
            width: ${this.size}px;
            height: ${this.size}px;
            opacity: ${this.opacity};
            animation-delay: ${Math.random() * 5}s;
        `;
        document.getElementById('particlesContainer').appendChild(this.element);
    }
    
    update() {
        // Update position
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Bounce off edges
        if (this.x <= 0 || this.x >= 100) {
            this.speedX *= -1;
            this.x = Math.max(0, Math.min(100, this.x));
        }
        if (this.y <= 0 || this.y >= 100) {
            this.speedY *= -1;
            this.y = Math.max(0, Math.min(100, this.y));
        }
        
        // Update pulsing opacity
        this.pulsePhase += 0.02;
        const pulseOpacity = this.opacity + Math.sin(this.pulsePhase) * 0.1;
        
        // Update DOM element
        if (this.element) {
            this.element.style.left = this.x + '%';
            this.element.style.top = this.y + '%';
            this.element.style.opacity = pulseOpacity;
        }
    }
}

// Floating shape class
class FloatingShape {
    constructor(type, index) {
        this.type = type;
        this.x = Math.random() * 90;
        this.y = Math.random() * 90;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.floatSpeed = Math.random() * 0.5 + 0.2;
        this.element = null;
        
        this.createElement(index);
    }
    
    createElement(index) {
        this.element = document.createElement('div');
        this.element.className = `floating-shape ${this.type}`;
        this.element.style.cssText = `
            left: ${this.x}%;
            top: ${this.y}%;
            width: 20px;
            height: 20px;
            animation-delay: ${index * 0.3}s;
        `;
        document.getElementById('floatingShapes').appendChild(this.element);
    }
    
    update() {
        this.rotation += this.rotationSpeed;
        this.y -= this.floatSpeed;
        
        // Reset when going off screen
        if (this.y < -10) {
            this.y = 110;
            this.x = Math.random() * 90;
        }
        
        if (this.element) {
            this.element.style.left = this.x + '%';
            this.element.style.top = this.y + '%';
            if (this.type === 'square') {
                this.element.style.transform = `rotate(${this.rotation}deg)`;
            }
        }
    }
}

// --- End of Animation Classes ---

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeParticles();
    initializeFloatingShapes();
    setupEventListeners();
    startAnimationLoop();

    // The key change is here: We now check for a property ID from a dynamic source
    // instead of hardcoding it. For this example, let's assume a valid ID is provided.
    // Replace the null check below with logic to get the ID from your UI.
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');

    if (idFromUrl) {
        currentPropertyId = idFromUrl;
        fetchAndRenderData(currentPropertyId);
    } else {
        // Fallback for demonstration: let's try a property ID that we know exists from your logs (if any).
        // For now, let's just show an error, as this is more accurate.
        showNotification('❌ No property ID provided in the URL.', 'error');
    }
});

// Initialize enhanced particle system
function initializeParticles() {
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new MovingParticle());
    }
}

// Initialize floating shapes
function initializeFloatingShapes() {
    const shapes = ['circle', 'square', 'triangle'];
    for (let i = 0; i < 15; i++) {
        const shape = new FloatingShape(shapes[i % 3], i);
        particles.push(shape);
    }
}

// Animation loop
function startAnimationLoop() {
    function animate() {
        particles.forEach(particle => {
            particle.update();
        });
        
        animationFrame = requestAnimationFrame(animate);
    }
    animate();
}

// Fetch data from the backend and populate the UI
async function fetchAndRenderData(propertyId) {
    if (!propertyId) {
        showNotification('❌ No property ID provided to fetch data.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${propertyId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            // Update global state with fetched data
            formData = {
                title: data.title,
                rent: data.rent,
                description: data.description,
                amenities: data.amenities || [],
                pros: data.pros || [],
                cons: data.cons || [],
                location: {
                    house: data.location?.house || '',
                    street: data.location?.street || '',
                    area: data.location?.area || '',
                    district: data.location?.district || '',
                    postal_code: data.location?.postal_code || ''
                }
            };
            
            images = data.images || [];

            initializeForm();
            showNotification('✅ Property data loaded from the backend!', 'success');
        } else {
            showNotification(`❌ Error fetching data: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showNotification('❌ Failed to connect to the backend server.', 'error');
    }
}

// Form Initialization
function initializeForm() {
    // Set initial form values based on the fetched formData
    document.getElementById('title').value = formData.title || '';
    document.getElementById('rent').value = formData.rent || '';
    document.getElementById('description').value = formData.description || '';
    document.getElementById('location-house').value = formData.location.house || '';
    document.getElementById('location-street').value = formData.location.street || '';
    document.getElementById('location-area').value = formData.location.area || '';
    document.getElementById('location-district').value = formData.location.district || '';
    document.getElementById('location-postal').value = formData.location.postal_code || '';

    
    // Render dynamic content based on fetched data
    renderAmenities();
    renderPros();
    renderCons();
    renderImages();
}

// Event Listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('propertyForm').addEventListener('submit', handleSubmit);
    
    // Image upload
    document.getElementById('images').addEventListener('change', handleImageUpload);
    
    // Enter key handlers for adding items
    document.getElementById('newAmenity').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addAmenity();
        }
    });
    
    document.getElementById('newPro').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPro();
        }
    });
    
    document.getElementById('newCon').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCon();
        }
    });
    
    // Form input changes
    const formInputs = ['title', 'rent', 'description', 'location-house', 'location-street', 'location-area', 'location-district', 'location-postal'];
formInputs.forEach(inputId => {
    document.getElementById(inputId).addEventListener('input', function(e) {
        if (inputId.startsWith('location-')) {
            const key = inputId.split('-')[1]; // 'house', 'street', etc.
            formData.location[key] = e.target.value;
        } else {
            formData[e.target.name || e.target.id] = e.target.value;
        }
    });
});

    
    // Added event listener for the reset button
    document.querySelector('[onclick="resetForm()"]').addEventListener('click', resetForm);
}

// Image Management
function renderImages() {
    const container = document.getElementById('imagesGrid');
    container.innerHTML = '';
    
    images.forEach((imageUrl, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${imageUrl}" alt="Property ${index + 1}" onerror="this.src='https://placehold.co/400x300/e2e8f0/1a202c?text=Image+Not+Found';">
            <button type="button" class="image-remove" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(imageItem);
    });
}

function handleImageUpload(event) {
    const files = event.target.files;
    if (files) {
         Array.from(files).forEach(file => {
             const dummyUrl = `https://placehold.co/400x300/6366f1/e2e8f0?text=Uploaded+Image`;
             images.push(dummyUrl);
         });
    }
    renderImages();
    showNotification('Images uploaded successfully!', 'success');
    event.target.value = '';
}

function removeImage(index) {
    images.splice(index, 1);
    renderImages();
    showNotification('Image removed', 'info');
}

// Amenities Management
function renderAmenities() {
    const container = document.getElementById('amenitiesContainer');
    container.innerHTML = '';
    
    formData.amenities.forEach((amenity, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `
            ${amenity}
            <button type="button" class="tag-remove" onclick="removeAmenity(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(tag);
    });
}

function addAmenity() {
    const input = document.getElementById('newAmenity');
    const value = input.value.trim();
    
    if (value) {
        formData.amenities.push(value);
        input.value = '';
        renderAmenities();
        showNotification(`Added amenity: ${value}`, 'success');
    }
}

function removeAmenity(index) {
    const removed = formData.amenities.splice(index, 1)[0];
    renderAmenities();
    showNotification(`Removed amenity: ${removed}`, 'info');
}

// Pros Management
function renderPros() {
    const container = document.getElementById('prosContainer');
    container.innerHTML = '';
    
    formData.pros.forEach((pro, index) => {
        const item = document.createElement('div');
        item.className = 'pros-item';
        item.innerHTML = `
            <span>${pro}</span>
            <button type="button" class="item-remove" onclick="removePro(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

function addPro() {
    const input = document.getElementById('newPro');
    const value = input.value.trim();
    
    if (value) {
        formData.pros.push(value);
        input.value = '';
        renderPros();
        showNotification(`Added pro: ${value}`, 'success');
    }
}

function removePro(index) {
    const removed = formData.pros.splice(index, 1)[0];
    renderPros();
    showNotification(`Removed pro: ${removed}`, 'info');
}

// Cons Management
function renderCons() {
    const container = document.getElementById('consContainer');
    container.innerHTML = '';
    
    formData.cons.forEach((con, index) => {
        const item = document.createElement('div');
        item.className = 'cons-item';
        item.innerHTML = `
            <span>${con}</span>
            <button type="button" class="item-remove" onclick="removeCon(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

function addCon() {
    const input = document.getElementById('newCon');
    const value = input.value.trim();
    
    if (value) {
        formData.cons.push(value);
        input.value = '';
        renderCons();
        showNotification(`Added con: ${value}`, 'success');
    }
}

function removeCon(index) {
    const removed = formData.cons.splice(index, 1)[0];
    renderCons();
    showNotification(`Removed con: ${removed}`, 'info');
}

// Form Actions
async function handleSubmit(event) {
    event.preventDefault();
    
    if (!currentPropertyId) {
        showNotification('❌ No property selected to update.', 'error');
        return;
    }
    
    // Create the updatedData object directly from form values
    const formElements = event.target.elements;
    const updatedData = {
        title: formElements.title.value,
        rent: parseInt(formElements.rent.value, 10),
        description: formElements.description.value,
        // The location object should be constructed from form inputs here
        location: {
            house: formElements['location-house'].value,
            street: formElements['location-street'].value,
            area: formElements['location-area'].value,
            district: formElements['location-district'].value,
            // Renamed 'postal_code' to 'postal' to match the backend
            postal: formElements['location-postal'].value
        },
        amenities: formData.amenities,
        pros: formData.pros,
        cons: formData.cons,
        // The images field should not be sent with this request
        // Images are handled by a separate route now
        status: 'published' // You might want to get this from a form element
    };
    
    try {
        const response = await fetch(`${API_URL}/${currentPropertyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const result = await response.json();
        
        if (result.success) {
            showNotification('🏠 Property updated successfully!', 'success');
            fetchAndRenderData(currentPropertyId);
        } else {
            showNotification(`❌ Failed to update property: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showNotification('❌ A network error occurred while saving. Check your backend server.', 'error');
    }
}

function resetForm() {
    if (currentPropertyId) {
        fetchAndRenderData(currentPropertyId);
        showNotification('🔄 Form reset to default values from database', 'info');
    } else {
        showNotification('❌ No property selected to reset.', 'error');
    }
}

// Enhanced Notification System
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => existingNotification.remove(), 300);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.style.animation='slideOut 0.3s ease-in forwards'; setTimeout(() => this.parentElement.remove(), 300)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

// Add notification animations to the page
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Enhanced Button Ripple Effect
document.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    if (button && !button.querySelector('.ripple') && button.tagName === 'BUTTON') {
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: rippleEffect 0.6s ease-out;
            pointer-events: none;
        `;
        
        if (getComputedStyle(button).position === 'static') {
            button.style.position = 'relative';
        }
        button.style.overflow = 'hidden';
        
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
});

// Add ripple animation styles
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    @keyframes rippleEffect {
        to { transform: scale(2); opacity: 0; }
    }
`;
document.head.appendChild(rippleStyles);

// Mouse interaction with particles
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 100;
    mouseY = (e.clientY / window.innerHeight) * 100;
    
    // Add subtle particle interaction
    particles.forEach((particle, index) => {
        if (particle instanceof MovingParticle && index % 5 === 0) {
            const dx = mouseX - particle.x;
            const dy = mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                particle.speedX += dx * 0.0001;
                particle.speedY += dy * 0.0001;
            }
        }
    });
});

// Window resize handler
window.addEventListener('resize', function() {
    // Recalculate particle positions if needed
    particles.forEach(particle => {
        if (particle instanceof MovingParticle) {
            particle.x = Math.max(0, Math.min(100, particle.x));
            particle.y = Math.max(0, Math.min(100, particle.y));
        }
    });
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});
