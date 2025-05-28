document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------
    // INICIO DEL CÓDIGO PARA EL REGISTRO DEL SERVICE WORKER (NUEVO)
    // --------------------------------------------------------------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito:', registration);
                })
                .catch(error => {
                    console.error('Fallo el registro del Service Worker:', error);
                });
        });
    }
    // --------------------------------------------------------------------
    // FIN DEL CÓDIGO PARA EL REGISTRO DEL SERVICE WORKER
    // --------------------------------------------------------------------


    // --------------------------------------------------------------------
    // TU CÓDIGO EXISTENTE PARA EL SIDEBAR Y CAMBIO DE SECCIONES VA AQUÍ
    // (Este código ya lo tienes y lo habíamos mejorado anteriormente)
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('main section');

    // Función para alternar la visibilidad del sidebar
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Función para mostrar la sección activa y ocultar las demás
    const showSection = (targetId) => {
        sections.forEach(section => {
            if (`#${section.id}` === targetId) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    };

    // Manejar clics en los enlaces del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href');
            showSection(targetId);

            menuLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Inicializar: Mostrar la primera sección al cargar la página
    if (menuLinks.length > 0) {
        const initialTargetId = menuLinks[0].getAttribute('href');
        showSection(initialTargetId);
        menuLinks[0].classList.add('active');
    }
    // --------------------------------------------------------------------
    // FIN DE TU CÓDIGO EXISTENTE
    // --------------------------------------------------------------------
});