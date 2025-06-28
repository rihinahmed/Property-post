new TypeIt("#dynamic-word", {
    strings: ["school", "college", "coaching", "university"],
    speed: 200,
    breakLines: false,
    loop: true,
    deleteSpeed: 50,
    nextStringDelay: 2500,
  }).go();

  const categoryButtons = document.querySelectorAll('.category-btn');

categoryButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    categoryButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // You can add filtering or other logic here
  });
});