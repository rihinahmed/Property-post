// Sidebar Toggle
function toggleSideMenu() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
  }

  // Setup listeners after DOM loads
  document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const sidebarClose = document.getElementById("sidebarClose");
    const sidebar = document.getElementById("sidebar");

    // Open
    mobileMenuBtn.addEventListener("click", toggleSideMenu);

    // Close
    sidebarClose.addEventListener("click", toggleSideMenu);

    // Close sidebar when clicking outside
    document.addEventListener("click", (e) => {
      if (
        sidebar.classList.contains("active") &&
        !sidebar.contains(e.target) &&
        !mobileMenuBtn.contains(e.target)
      ) {
        sidebar.classList.remove("active");
      }
    });
  });