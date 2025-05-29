
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".submenu-toggle");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = toggle.nextElementSibling;
      const arrow = toggle.querySelector(".arrow-icon");
      submenu.style.display = submenu.style.display === "block" ? "none" : "block";
      arrow.classList.toggle("rotate");
    });
  });

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });
});
