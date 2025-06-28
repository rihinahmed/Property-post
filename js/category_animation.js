document.addEventListener("DOMContentLoaded", function () {
    // Animate featured cards
    const cards = document.querySelectorAll(".featured-card");
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const card = entry.target;
          const index = [...cards].indexOf(card);
          card.style.transitionDelay = `${index * 300}ms`;
          card.classList.add("animate");
          cardObserver.unobserve(card);
        }
      });
    }, { threshold: 0.2 });

    cards.forEach(card => cardObserver.observe(card));

    // Animate category buttons one by one
    const buttons = document.querySelectorAll(".category-btn");
    const buttonObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          buttons.forEach((btn, index) => {
            setTimeout(() => {
              btn.classList.add("animate");
            }, index * 120); // stagger timing
          });
          buttonObserver.disconnect(); // animate only once
        }
      });
    }, { threshold: 0.2 });

    if (buttons.length > 0) {
      buttonObserver.observe(buttons[0].parentElement); // observe the .category-list
    }
  });