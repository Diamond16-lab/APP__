document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------
    // CÓDIGO PARA EL REGISTRO DEL SERVICE WORKER (¡MANTENER ESTO!)
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
    // TU CÓDIGO PARA EL SIDEBAR Y CAMBIO DE SECCIONES (Ajustado)
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a'); // Selecciona TODOS los enlaces del menú
    const sections = document.querySelectorAll('main section');

    // Función para alternar la visibilidad del sidebar
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Lógica para menús desplegables (¡MANTENER ESTO!)
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault(); // Evita que el enlace del toggle navegue si tiene un href

            const parentLi = toggle.closest('li.has-submenu');
            if (parentLi) {
                const submenu = parentLi.querySelector('.submenu');
                if (submenu) {
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

    // Función para mostrar la sección activa y ocultar las demás (¡MANTENER ESTO!)
    const showSection = (targetId) => {
        sections.forEach(section => {
            if (`#${section.id}` === targetId) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    };

    // Manejar clics en los enlaces del menú (¡MANTENER ESTO!)
    menuLinks.forEach(link => {
        // Asegurarse de que este event listener solo afecte a enlaces que NO son toggles de submenú
        if (!link.classList.contains('submenu-toggle')) {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir la navegación predeterminada
                const targetId = link.getAttribute('href');

                // Ocultar todas las secciones antes de mostrar la nueva
                // (Esto ya se hace dentro de showSection, pero un reset explícito no hace daño si lo tenías así)
                // sections.forEach(section => { section.style.display = 'none'; });

                showSection(targetId);

                // Remover 'active' de todos los enlaces del menú principal (todos los .menu a)
                menuLinks.forEach(item => item.classList.remove('active'));
                // Añadir 'active' al enlace clickeado
                link.classList.add('active');

                // Opcional: Asegurarse de que el submenú padre se mantenga abierto y activo
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

    // ** MODIFICACIÓN CRUCIAL: Eliminar o comentar la inicialización de la primera sección **
    // Esto asegura que al cargar la página, NINGUNA sección se muestre por defecto.
    /*
    const initialLink = document.querySelector('.menu a:not(.submenu-toggle)');
    if (initialLink) {
        const initialTargetId = initialLink.getAttribute('href');
        showSection(initialTargetId);
        initialLink.classList.add('active');
    }
    */
    // --------------------------------------------------------------------
    // FIN DEL CÓDIGO PARA EL SIDEBAR Y SECCIONES
    // --------------------------------------------------------------------
});