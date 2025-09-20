const userCardTemplate = document.querySelector("[data-user-template]");

const userCardContainer = document.querySelector("[data-user-cards-container]");

const searchInput = document.querySelector("[data-search]");

let users = []

searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
    console.log(value);
    users.forEach(user => {
        const isVisible =user.location.toLowerCase().includes(value) || user.description.toLowerCase().includes(value)
            //user.email.toLowerCase().includes(value);
            user.element.classList.toggle("hide", !isVisible);
    });
});
console.log(12);

fetch("http://localhost:5000/api/search/all")
  .then(res => res.json())
  .then(data => {
    console.log("Properties:", data)

    users = data.map(user => {

        const card = userCardTemplate.content.cloneNode(true).children[0]
        const title = card.querySelector("[data-title]")
        const location = card.querySelector("[data-location]")
        const description = card.querySelector("[data-description]")
        const rent = card.querySelector("[data-rent]")
        const status=card.querySelector("[data-status]")
        const img = card.querySelector("[data-image]")
        console.log(user.img)
        title.textContent = user.title
        location.textContent = user.location
        description.textContent = user.description
        status.textContent=user.status
        rent.textContent = "৳" + user.rent + "/month"
        
       img.src = user.img ? `http://localhost:5500/backend/selleruploads/${user.img}` : 'http://localhost:5000/selleruploads/fallback.jpg'; // optional fallback

        card.classList.add("animate");

        userCardContainer.append(card)

        return { title: user.title, location: user.location, description: user.description, rent: user.rent,status: user.status, element: card }
    })

  })
  .catch(err => console.error(err))
    .finally(() => console.log("Fetch attempt finished."));