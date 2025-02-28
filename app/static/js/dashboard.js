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

document.addEventListener('DOMContentLoaded', function() {
    // Función para abrir el modal con los detalles del formulario
    function abrirModalFormulario(formId) {
        cargarDetalles(formId);  // Cargar los detalles del formulario
        $('#detallesModal').modal('show');  // Mostrar el modal
    }

    // Manejar clic en los enlaces de formularios recientes
    document.querySelectorAll('.notif-formulario').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();  // Evitar el comportamiento predeterminado del enlace
            const formId = this.dataset.formId;
            const urlPerfil = this.getAttribute('href');  // Obtener la URL del enlace
            window.location.href = urlPerfil;  // Redirigir a la ruta de perfil con el hash del formulario
        });
    });

    // Abrir el modal automáticamente si la URL tiene un hash de formulario
    if (window.location.hash.includes('formulario-')) {
        const formId = window.location.hash.split('-')[1];
        abrirModalFormulario(formId);
    }

    // Escuchar cambios en el hash de la URL
    window.addEventListener('hashchange', function() {
        if (window.location.hash.includes('formulario-')) {
            const formId = window.location.hash.split('-')[1];
            abrirModalFormulario(formId);
        }
    });
});