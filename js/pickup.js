const form = document.getElementById("pickupForm");
const popup = document.getElementById("ripplePopup");

form.addEventListener("submit", function(e) {
  e.preventDefault();
  
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
    form.reset();
  }, 3000);
});

popup.addEventListener("click", () => {
  popup.classList.remove("show");
});
