document.addEventListener('DOMContentLoaded', () => {
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
                section.style.display = 'block'; // Muestra la sección
            } else {
                section.style.display = 'none'; // Oculta las demás
            }
        });
    };

    // Manejar clics en los enlaces del menú
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Evita la recarga de la página
            const targetId = link.getAttribute('href');
            showSection(targetId);

            // Opcional: Remover la clase 'active' de todos los enlaces y añadirla al clicado
            menuLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Inicializar: Mostrar la primera sección al cargar la página y marcarla como activa
    if (menuLinks.length > 0) {
        const initialTargetId = menuLinks[0].getAttribute('href');
        showSection(initialTargetId);
        menuLinks[0].classList.add('active'); // Marca el primer enlace como activo
    }
});