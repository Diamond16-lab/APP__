document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------
    // REGISTRO DEL SERVICE WORKER
    // --------------------------------------------------------------------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('Service Worker registrado:', reg))
                .catch(err => console.error('Error al registrar el Service Worker:', err));
        });
    }

    // --------------------------------------------------------------------
    // MANEJO DEL SIDEBAR Y NAVEGACIÓN DE SECCIONES
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('main section');
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    // Alternar sidebar
    toggleBtn?.addEventListener('click', () => {
        sidebar?.classList.toggle('collapsed');
    });

    // Alternar submenús (solo uno abierto a la vez)
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', e => {
            e.preventDefault();

            const parentLi = toggle.closest('li.has-submenu');
            const submenu = parentLi?.querySelector('.submenu');

            if (submenu) {
                const isActive = submenu.classList.contains('active');

                // Cerrar todos los submenús
                submenuToggles.forEach(otherToggle => {
                    const otherParent = otherToggle.closest('li.has-submenu');
                    const otherSubmenu = otherParent?.querySelector('.submenu');
                    otherToggle.classList.remove('active');
                    otherSubmenu?.classList.remove('active');
                });

                // Si no estaba activo, abrir el clickeado
                if (!isActive) {
                    toggle.classList.add('active');
                    submenu.classList.add('active');
                }
            }
        });
    });

    // Mostrar la sección correspondiente
    function showSection(targetId) {
        sections.forEach(section => {
            section.style.display = `#${section.id}` === targetId ? 'block' : 'none';
        });
    }

    // Manejar clics en los enlaces del menú (excluye toggles)
    menuLinks.forEach(link => {
        if (!link.classList.contains('submenu-toggle')) {
            link.addEventListener('click', e => {
                e.preventDefault();

                const targetId = link.getAttribute('href');
                if (!targetId) return;

                showSection(targetId);

                // Actualizar clases 'active'
                menuLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');

                // Mantener submenús abiertos si es necesario
                const parentSubmenu = link.closest('.submenu');
                const parentToggle = parentSubmenu?.previousElementSibling;

                parentToggle?.classList.add('active');
                parentSubmenu?.classList.add('active');
            });
        }
    });

    // Mostrar sección inicial al cargar
    const firstLink = document.querySelector('.menu a:not(.submenu-toggle)');
    if (firstLink) {
        const target = firstLink.getAttribute('href');
        showSection(target);
        firstLink.classList.add('active');
    }
});