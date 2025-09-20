// js/pickup.js

const API_BASE_URL = "http://localhost:5000/api";

const form = document.getElementById("pickupForm");
const popup = document.getElementById("ripplePopup");
const formMessage = document.getElementById("formMessage");

// Function to check session and load the page
async function checkSessionAndLoadPage() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/session`, {
            credentials: 'include' // This is crucial for sending the session cookie
        });
        const result = await response.json();

        if (result.loggedIn) {
            // User is logged in, attach form submission handler
            if (form) {
                form.addEventListener("submit", handleFormSubmission);
            }
        } else {
            // Not logged in, redirect to login page
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error("Session check failed:", error);
        // Redirect to login page as a fallback for network or server errors
        window.location.href = 'login.html';
    }
}

// Function to handle the form submission
async function handleFormSubmission(event) {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    formMessage.textContent = ""; // Clear previous message

    try {
        const response = await fetch(`${API_BASE_URL}/pickup/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            popup.classList.add("show");
            formMessage.textContent = "✅ Your request has been submitted!";
            formMessage.style.color = "#28a745"; // Green color
            
            setTimeout(() => {
                popup.classList.remove("show");
                form.reset();
                formMessage.textContent = "";
            }, 3000);
        } else {
            formMessage.textContent = `❌ Error: ${result.message}`;
            formMessage.style.color = "#dc3545"; // Red color
        }
    } catch (error) {
        console.error("Submission failed:", error);
        formMessage.textContent = "❌ Failed to connect to the server. Please try again later.";
        formMessage.style.color = "#dc3545";
    }
}

// Other existing scripts for animations remain unchanged
const stepCards = document.querySelectorAll('.step-card');
const animateOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    stepCards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        if (cardTop < triggerBottom) {
            card.classList.add('visible');
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', () => {
    document.body.classList.add("animate-body");
    animateOnScroll();
});



// Start the session check when the page loads
document.addEventListener("DOMContentLoaded", checkSessionAndLoadPage);