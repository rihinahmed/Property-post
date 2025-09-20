// Sample room data
const roomData = {
    id: "room-001",
    title: "Luxury Modern Apartment",
    location: "Dhanmondi, Dhaka",
    rent: 25000,
    description: "This beautiful modern apartment offers a perfect blend of comfort and style. Located in the heart of Dhanmondi, it provides easy access to restaurants, shopping centers, and transportation. The apartment features contemporary furnishings, high-speed internet, and all essential amenities for a comfortable living experience.",
    amenities: [
        "High-Speed WiFi",
        "Air Conditioning", 
        "24/7 Security",
        "Parking Space",
        "Balcony",
        "Modern Kitchen",
        "Elevator Access",
        "Backup Generator"
    ],
    images: [
        "https://images.unsplash.com/photo-1603072388139-565853396b38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBiZWRyb29tJTIwYXBhcnRtZW50fGVufDF8fHx8MTc1ODE5MjQ2NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1679862342541-e408d4f3ab80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxsdXh1cnklMjBsaXZpbmclMjByb29tJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzU4Mjc3MjkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1688786219616-598ed96aa19d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiYXRocm9vbSUyMG1vZGVybiUyMGRlc2lnbnxlbnwxfHx8fDE3NTgyNzcyOTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1603072819161-e864800276cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxraXRjaGVuJTIwYXBhcnRtZW50JTIwbW9kZXJufGVufDF8fHx8MTc1ODI3NzI5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    ],
    owner: {
        name: "Ahmed Rahman",
        contact: "+880 1712 345678"
    },
    status: "Available"
};

const samplePros = [
    "Prime location in Dhanmondi with excellent connectivity",
    "Modern amenities and well-furnished interior", 
    "24/7 security and concierge service",
    "Close to educational institutions and hospitals",
    "Excellent public transportation access",
    "Nearby shopping centers and restaurants"
];

const sampleCons = [
    "Higher rent compared to other areas",
    "Limited parking spaces during peak hours",
    "Street noise during daytime",
    "No pets allowed policy"
];

// Global variables
let currentImageIndex = 0;
let isSaved = false;
let isMessageUnlocked = false;
let isMapUnlocked = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    initializeScrollAnimations();
    initializeAdvancedAnimations();
});

function initializePage() {
    // Load room data
    loadRoomData();
    
    // Load saved states from localStorage
    loadSavedStates();
    
    // Initialize carousel
    initializeCarousel();
    
    // Load pros and cons
    loadProsAndCons();
    
    // Load gallery
    loadGallery();
}

function loadRoomData() {
    // Set room details
    document.getElementById('roomTitle').textContent = roomData.title;
    document.getElementById('roomLocation').textContent = roomData.location;
    document.getElementById('roomRent').textContent = `৳${roomData.rent.toLocaleString()}/month`;
    document.getElementById('roomDescription').textContent = roomData.description;
    document.getElementById('ownerName').textContent = `Owner: ${roomData.owner.name}`;
    document.getElementById('ownerContact').textContent = roomData.owner.contact;
    document.getElementById('mapLocation').textContent = roomData.location;
    
    // Set room status
    const statusElement = document.getElementById('roomStatus');
    statusElement.textContent = roomData.status;
    statusElement.className = `status-badge ${roomData.status.toLowerCase().replace(' ', '-')}`;
    
    // Load amenities
    const amenitiesGrid = document.getElementById('amenitiesGrid');
    amenitiesGrid.innerHTML = '';
    roomData.amenities.forEach(amenity => {
        const amenityItem = document.createElement('div');
        amenityItem.className = 'amenity-item';
        amenityItem.innerHTML = `
            <i class="fas fa-check"></i>
            <span>${amenity}</span>
        `;
        amenitiesGrid.appendChild(amenityItem);
    });
}

function loadSavedStates() {
    // Check saved rooms
    const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
    isSaved = savedRooms.includes(roomData.id);
    updateSaveButton();
    
    // Check unlocked messages
    const unlockedMessages = JSON.parse(localStorage.getItem('unlockedMessages') || '[]');
    isMessageUnlocked = unlockedMessages.includes(roomData.id);
    updateMessageButton();
    
    // Check unlocked maps
    const unlockedMaps = JSON.parse(localStorage.getItem('unlockedMaps') || '[]');
    isMapUnlocked = unlockedMaps.includes(roomData.id);
    updateMapSection();
}

function initializeCarousel() {
    const carouselImages = document.getElementById('carouselImages');
    const carouselDots = document.getElementById('carouselDots');
    
    // Clear existing content
    carouselImages.innerHTML = '';
    carouselDots.innerHTML = '';
    
    // Add images
    roomData.images.forEach((image, index) => {
        const img = document.createElement('img');
        img.src = image;
        img.alt = `Room image ${index + 1}`;
        img.className = 'carousel-image';
        carouselImages.appendChild(img);
        
        // Add dots
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        carouselDots.appendChild(dot);
    });
    
    updateCarousel();
}

function loadProsAndCons() {
    // Load pros
    const prosList = document.getElementById('prosList');
    prosList.innerHTML = '';
    samplePros.forEach(pro => {
        const prosItem = document.createElement('div');
        prosItem.className = 'pros-item';
        prosItem.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${pro}</span>
        `;
        prosList.appendChild(prosItem);
    });
    
    // Load cons
    const consList = document.getElementById('consList');
    consList.innerHTML = '';
    sampleCons.forEach(con => {
        const consItem = document.createElement('div');
        consItem.className = 'cons-item';
        consItem.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>${con}</span>
        `;
        consList.appendChild(consItem);
    });
}

function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';
    
    roomData.images.forEach((image, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.innerHTML = `
            <img src="${image}" alt="Gallery image ${index + 1}" class="gallery-image">
            <div class="gallery-overlay">
                <i class="fas fa-search-plus"></i>
            </div>
        `;
        galleryItem.addEventListener('click', () => openLightbox(image));
        galleryGrid.appendChild(galleryItem);
    });
}

function setupEventListeners() {
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
        if (mobileMenu.classList.contains('active')) {
            menuIcon.className = 'fas fa-times';
        } else {
            menuIcon.className = 'fas fa-bars';
        }
    });
    
    // Carousel controls
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    
    // Action buttons
    document.getElementById('saveBtn').addEventListener('click', toggleSaveRoom);
    document.getElementById('messageBtn').addEventListener('click', handleMessageAction);
    
    // Map unlock
    document.getElementById('unlockMapBtn').addEventListener('click', unlockMap);
    
    // Lightbox
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox();
        }
    });
    
    // Auto-advance carousel
    setInterval(nextSlide, 5000);
}

// Carousel functions
function nextSlide() {
    currentImageIndex = (currentImageIndex + 1) % roomData.images.length;
    updateCarousel();
}

function prevSlide() {
    currentImageIndex = (currentImageIndex - 1 + roomData.images.length) % roomData.images.length;
    updateCarousel();
}

function goToSlide(index) {
    currentImageIndex = index;
    updateCarousel();
}

function updateCarousel() {
    const carouselImages = document.getElementById('carouselImages');
    const dots = document.querySelectorAll('.carousel-dot');
    
    // Update image position
    const translateX = -currentImageIndex * 100;
    carouselImages.style.transform = `translateX(${translateX}%)`;
    
    // Update dots
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentImageIndex);
    });
}

// Save room functionality
function toggleSaveRoom() {
    const savedRooms = JSON.parse(localStorage.getItem('savedRooms') || '[]');
    
    if (isSaved) {
        // Remove from saved
        const updatedRooms = savedRooms.filter(id => id !== roomData.id);
        localStorage.setItem('savedRooms', JSON.stringify(updatedRooms));
        isSaved = false;
        showToast('Room removed from saved list', 'success');
    } else {
        // Add to saved
        savedRooms.push(roomData.id);
        localStorage.setItem('savedRooms', JSON.stringify(savedRooms));
        isSaved = true;
        showToast('Room saved successfully!', 'success');
    }
    
    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    const saveIcon = document.getElementById('saveIcon');
    const saveText = document.getElementById('saveText');
    
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
        const confirmed = confirm('Unlock messaging with owner for ৳100?');
        if (confirmed) {
            const unlockedMessages = JSON.parse(localStorage.getItem('unlockedMessages') || '[]');
            unlockedMessages.push(roomData.id);
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
    
    if (isMessageUnlocked) {
        messageBtn.classList.add('unlocked');
        messageText.textContent = 'Send Message';
    } else {
        messageBtn.classList.remove('unlocked');
        messageText.textContent = 'Unlock Message (৳100)';
    }
}

// Map functionality
function unlockMap() {
    const confirmed = confirm('Unlock the exact location for ৳100?');
    if (confirmed) {
        const unlockedMaps = JSON.parse(localStorage.getItem('unlockedMaps') || '[]');
        unlockedMaps.push(roomData.id);
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
    
    lightboxImage.src = imageSrc;
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightboxModal = document.getElementById('lightboxModal');
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
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

// Utility functions
function formatCurrency(amount) {
    return `৳${amount.toLocaleString()}`;
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

// Enhanced hover effects for gallery items
function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid.innerHTML = '';
    
    roomData.images.forEach((image, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item animate-on-scroll';
        galleryItem.style.opacity = '0';
        galleryItem.style.transform = 'translateY(50px)';
        galleryItem.style.transitionDelay = `${index * 0.1}s`;
        
        galleryItem.innerHTML = `
            <img src="${image}" alt="Gallery image ${index + 1}" class="gallery-image">
            <div class="gallery-overlay">
                <i class="fas fa-search-plus"></i>
            </div>
        `;
        
        galleryItem.addEventListener('click', () => openLightbox(image));
        
        // Add 3D tilt effect
        galleryItem.addEventListener('mousemove', (e) => {
            const rect = galleryItem.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            galleryItem.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
        });
        
        galleryItem.addEventListener('mouseleave', () => {
            galleryItem.style.transform = '';
        });
        
        galleryGrid.appendChild(galleryItem);
    });
}

// Enhanced amenities loading with staggered animation
function loadRoomData() {
    // Set room details
    document.getElementById('roomTitle').textContent = roomData.title;
    document.getElementById('roomLocation').textContent = roomData.location;
    document.getElementById('roomRent').textContent = `৳${roomData.rent.toLocaleString()}/month`;
    document.getElementById('roomDescription').textContent = roomData.description;
    document.getElementById('ownerName').textContent = `Owner: ${roomData.owner.name}`;
    document.getElementById('ownerContact').textContent = roomData.owner.contact;
    document.getElementById('mapLocation').textContent = roomData.location;
    
    // Set room status
    const statusElement = document.getElementById('roomStatus');
    statusElement.textContent = roomData.status;
    statusElement.className = `status-badge ${roomData.status.toLowerCase().replace(' ', '-')}`;
    
    // Load amenities with animation
    const amenitiesGrid = document.getElementById('amenitiesGrid');
    amenitiesGrid.innerHTML = '';
    roomData.amenities.forEach((amenity, index) => {
        const amenityItem = document.createElement('div');
        amenityItem.className = 'amenity-item';
        amenityItem.style.opacity = '0';
        amenityItem.style.transform = 'translateY(20px)';
        amenityItem.style.transition = 'all 0.5s ease';
        amenityItem.style.transitionDelay = `${index * 0.1}s`;
        
        amenityItem.innerHTML = `
            <i class="fas fa-check"></i>
            <span>${amenity}</span>
        `;
        
        amenitiesGrid.appendChild(amenityItem);
        
        // Trigger animation
        setTimeout(() => {
            amenityItem.style.opacity = '1';
            amenityItem.style.transform = 'translateY(0)';
        }, 100 + index * 100);
    });
}

// Enhanced pros and cons loading
function loadProsAndCons() {
    // Load pros with staggered animation
    const prosList = document.getElementById('prosList');
    prosList.innerHTML = '';
    samplePros.forEach((pro, index) => {
        const prosItem = document.createElement('div');
        prosItem.className = 'pros-item';
        prosItem.style.opacity = '0';
        prosItem.style.transform = 'translateX(-30px)';
        prosItem.style.transition = 'all 0.6s ease';
        prosItem.style.transitionDelay = `${index * 0.1}s`;
        
        prosItem.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${pro}</span>
        `;
        prosList.appendChild(prosItem);
    });
    
    // Load cons with staggered animation
    const consList = document.getElementById('consList');
    consList.innerHTML = '';
    sampleCons.forEach((con, index) => {
        const consItem = document.createElement('div');
        consItem.className = 'cons-item';
        consItem.style.opacity = '0';
        consItem.style.transform = 'translateX(30px)';
        consItem.style.transition = 'all 0.6s ease';
        consItem.style.transitionDelay = `${index * 0.1}s`;
        
        consItem.innerHTML = `
            <i class="fas fa-times-circle"></i>
            <span>${con}</span>
        `;
        consList.appendChild(consItem);
    });
}

// Enhanced carousel with smooth transitions
function updateCarousel() {
    const carouselImages = document.getElementById('carouselImages');
    const dots = document.querySelectorAll('.carousel-dot');
    
    // Update image position with smooth easing
    const translateX = -currentImageIndex * 100;
    carouselImages.style.transform = `translateX(${translateX}%)`;
    carouselImages.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Update dots with animation
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentImageIndex);
        if (index === currentImageIndex) {
            dot.style.transform = 'scale(1.3)';
        } else {
            dot.style.transform = 'scale(1)';
        }
    });
}

// Initialize page when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializePage();
        setupEventListeners();
        initializeScrollAnimations();
        initializeAdvancedAnimations();
    });
} else {
    initializePage();
    setupEventListeners();
    initializeScrollAnimations();
    initializeAdvancedAnimations();
}