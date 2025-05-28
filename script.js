document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------
    // CÓDIGO PARA EL REGISTRO DEL SERVICE WORKER (¡DEBE ESTAR AQUÍ!)
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
    // TU CÓDIGO PARA EL SIDEBAR Y CAMBIO DE SECCIONES (¡DEBE ESTAR AQUÍ!)
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
    document.addEventListener('DOMContentLoaded', () => {
    // ... (Tu código existente para el Service Worker y el toggleBtn) ...

    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('main section');

    // ** NUEVO: Lógica para menús desplegables **
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            const parentLi = toggle.closest('li.has-submenu');
            if (parentLi) {
                const submenu = parentLi.querySelector('.submenu');
                if (submenu) {
                    // Prevenir el comportamiento por defecto del enlace si no queremos navegar
                    event.preventDefault(); 
                    
                    // Alternar la clase 'active' en el submenú
                    submenu.classList.toggle('active');
                    // Alternar la clase 'active' en el toggle para rotar la flecha
                    toggle.classList.toggle('active');

                    // Opcional: Cerrar otros submenús si solo quieres uno abierto a la vez
                    submenuToggles.forEach(otherToggle => {
                        if (otherToggle !== toggle) {
                            const otherParentLi = otherToggle.closest('li.has-submenu');
                            if (otherParentLi) {
                                const otherSubmenu = otherParentLi.querySelector('.submenu');
                                if (otherSubmenu && otherSubmenu.classList.contains('active')) {
                                    otherSubmenu.classList.remove('active');
                                    otherToggle.classList.remove('active');
                                }
                            }
                        }
                    });
                }
            }
        });
    });

    // ** MODIFICACIÓN: Ajustar el manejo de clics para enlaces de submenú **
    // Asegurarse de que solo se manejen los enlaces que no son toggles de submenú
    menuLinks.forEach(link => {
        if (!link.classList.contains('submenu-toggle')) { // Ignorar los toggles del submenú
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = link.getAttribute('href');
                showSection(targetId);

                // Remover 'active' de todos los enlaces del menú principal
                menuLinks.forEach(item => item.classList.remove('active'));
                // Añadir 'active' al enlace clickeado
                link.classList.add('active');

                // Si un enlace de submenú es clickeado, asegúrate de que el padre 'submenu-toggle' también esté activo
                const parentSubmenu = link.closest('.submenu');
                if (parentSubmenu) {
                    const parentToggle = parentSubmenu.previousElementSibling; // El elemento 'a.submenu-toggle' antes del submenú
                    if (parentToggle && !parentToggle.classList.contains('active')) {
                        parentToggle.classList.add('active');
                        parentSubmenu.classList.add('active'); // Asegura que el submenú se mantenga abierto
                    }
                }
            });
        }
    });

    // ... (El resto de tu código existente para showSection e inicialización) ...
});
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
    // FIN DEL CÓDIGO PARA EL SIDEBAR Y SECCIONES
    // --------------------------------------------------------------------
});