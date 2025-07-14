
    const chatButton = document.getElementById("chat-button");
    const chatWindow = document.getElementById("chat-window");
    const closeChatButton = document.getElementById("close-chat");
    const sendMessageButton = document.getElementById("send-message");
    const chatInput = document.getElementById("chat-input");
    const messageContainer = document.getElementById("message-container");

    // Open/Close chat window
    chatButton.addEventListener("click", () => {
        chatWindow.classList.add("show"); // Show chat window with smooth animation
    });

    closeChatButton.addEventListener("click", () => {
        chatWindow.classList.remove("show"); // Close chat window with smooth transition
    });

    // Send message functionality
    sendMessageButton.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (message) {
            const newMessage = document.createElement("div");
            newMessage.classList.add("chat-message", "outgoing"); // Add 'outgoing' class for styled sent messages
            newMessage.textContent = message;
            messageContainer.appendChild(newMessage);
            chatInput.value = ""; // Clear the input field
            messageContainer.scrollTop = messageContainer.scrollHeight; // Auto-scroll to latest message
        }
    });

    // Optional: Close chat when clicking outside
    window.addEventListener("click", (e) => {
        if (!chatWindow.contains(e.target) && !chatButton.contains(e.target)) {
            chatWindow.classList.remove("show");
        }
    });