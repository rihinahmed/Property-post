document.addEventListener("DOMContentLoaded", () => {
    const feedbackSection = document.querySelector('.feedback-section-2col');
  
    // Function to handle the visibility of the feedback section
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          feedbackSection.classList.add('animate');
          observer.unobserve(feedbackSection); // Stop observing after the animation trigger
        }
      });
    }, { threshold: 0.2 });
  
    // Observe the feedback section
    observer.observe(feedbackSection);
});
