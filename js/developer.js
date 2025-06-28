let currentIndex = 2;
const developerCards = document.querySelectorAll('.developer-card');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

// Update the active developer card
function updateCarousel() {
    developerCards.forEach((card, index) => {
        card.classList.remove('active');
        if (index === currentIndex) {
            card.classList.add('active');
        }
    });
}

// Move to the next developer card
nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % developerCards.length;
    updateCarousel();
});

// Move to the previous developer card
prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + developerCards.length) % developerCards.length;
    updateCarousel();
});

// Initialize the carousel
updateCarousel();
