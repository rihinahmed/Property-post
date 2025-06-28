const track = document.querySelector('.carousel-track');
  const cards = document.querySelectorAll('.featured-card');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');

  let currentIndex = 0;
  const cardWidth = cards[0].offsetWidth + 20; // width + gap

  nextBtn.addEventListener('click', () => {
    if (currentIndex < cards.length - 1) {
      currentIndex++;
      track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }
  });
  document.querySelectorAll('.featured-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
  });