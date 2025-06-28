const slide = document.querySelector('.carousel-slide');
const images = document.querySelectorAll('.carousel-slide img');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');
const dots = document.querySelectorAll('.dot');

let counter = 0;

function showSlide() {
  const width = images[0].clientWidth;
  slide.style.transform = `translateX(${-counter * width}px)`;

  // Update dots
  dots.forEach(dot => dot.classList.remove('active'));
  dots[counter].classList.add('active');
}

nextBtn.addEventListener('click', () => {
  counter = (counter + 1) % images.length;
  showSlide();
});

prevBtn.addEventListener('click', () => {
  counter = (counter - 1 + images.length) % images.length;
  showSlide();
});

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    counter = parseInt(dot.dataset.index);
    showSlide();
  });
});

// Auto slide every 5 seconds
setInterval(() => {
  counter = (counter + 1) % images.length;
  showSlide();
}, 5000);

// Initialize
showSlide();
