document.addEventListener('DOMContentLoaded', () => {
    const menu = document.querySelector('.side-menu');
    const toggleBtn = document.querySelector('.menu-icon');
  
    document.addEventListener('click', (e) => {
      const isClickInsideMenu = menu.contains(e.target);
      const isToggleClick = toggleBtn.contains(e.target);
  
      if (!isClickInsideMenu && !isToggleClick) {
        menu.classList.remove('active'); // close the sidebar
      }
    });
  });
    function toggleSideMenu() {
    const sideMenu = document.getElementById('sideMenu');
    sideMenu.classList.toggle('active');
  }