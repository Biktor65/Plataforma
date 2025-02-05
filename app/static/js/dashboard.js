document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('sidebar');
    
    // Verifica que los elementos existan antes de agregarles un listener
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open'); // Cambia la clase activa al hacer clic
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("toggleDarkMode");
    const body = document.body;

    // Verificar si el modo oscuro está activo en localStorage
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.innerHTML = '<i class="fas fa-sun me-2"></i> Light Mode';
    }

    // Evento para cambiar entre modos
    darkModeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
            darkModeToggle.innerHTML = '<i class="fas fa-sun me-2"></i> Light Mode';
        } else {
            localStorage.setItem("darkMode", "disabled");
            darkModeToggle.innerHTML = '<i class="fas fa-moon me-2"></i> Dark Mode';
        }
    });
});