const savedRooms = [
    {
      id: 1,
      title: "Family Apartment in Dhanmondi",
      location: "Dhanmondi",
      price: 15000,
      desc: "Spacious 3BHK, near bus stand. Secure and affordable.",
      img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1171",
    },
    {
      id: 2,
      title: "Bachelor Hostel in Mirpur",
      location: "Mirpur 10",
      price: 4500,
      desc: "Shared room with Wi-Fi, mess and security included.",
      img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=1171",
    }
  ];
  
  let currentRooms = [...savedRooms];
  let lastRemoved = null;
  
  function renderRooms() {
    const grid = document.getElementById("savedGrid");
    grid.innerHTML = "";
  
    currentRooms.forEach(room => {
      const card = document.createElement("div");
      card.className = "saved-card";
      card.innerHTML = `
        <img src="${room.img}" alt="Room">
        <div class="saved-info">
          <h3>${room.title}</h3>
          <p>${room.desc}</p>
          <div class="saved-meta">
            <span>📍 ${room.location}</span>
            <span>৳ ${room.price.toLocaleString()}/mo</span>
          </div>
          <button class="unsave-btn" onclick="removeRoom(${room.id})">💔 Remove</button>
        </div>
      `;
      grid.appendChild(card);
    });
  
    localStorage.setItem("savedRooms", JSON.stringify(currentRooms));
  }
  
  function removeRoom(id) {
    lastRemoved = currentRooms.find(r => r.id === id);
    currentRooms = currentRooms.filter(r => r.id !== id);
    renderRooms();
    showUndo();
  }
  
  function showUndo() {
    const toast = document.getElementById("undoToast");
    toast.style.display = "block";
    setTimeout(() => toast.style.display = "none", 4000);
  }
  
  function undoRemove() {
    if (lastRemoved) {
      currentRooms.push(lastRemoved);
      lastRemoved = null;
      renderRooms();
      document.getElementById("undoToast").style.display = "none";
    }
  }
  
  document.getElementById("themeToggle").onclick = () => {
    document.body.classList.toggle("dark");
  };
  
  document.getElementById("sortOptions").onchange = function () {
    const value = this.value;
    if (value === "location") {
      currentRooms.sort((a, b) => a.location.localeCompare(b.location));
    } else if (value === "priceLow") {
      currentRooms.sort((a, b) => a.price - b.price);
    } else if (value === "priceHigh") {
      currentRooms.sort((a, b) => b.price - a.price);
    }
    renderRooms();
  };
  
  window.onload = function () {
    const saved = JSON.parse(localStorage.getItem("savedRooms"));
    if (saved) currentRooms = saved;
    renderRooms();
  };
  