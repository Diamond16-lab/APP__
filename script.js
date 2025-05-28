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
    // TU CÓDIGO PARA EL SIDEBAR Y CAMBIO DE SECCIONES (COMPLETO)
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a'); // Selecciona TODOS los enlaces del menú
    const sections = document.querySelectorAll('main section');

    // Referencias al modal (¡NUEVO!)
    const accessModal = document.getElementById('accessModal');
    const closeButton = document.querySelector('.close-button');
    const accessForm = document.getElementById('accessForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

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

    // Manejar clics en los enlaces del menú (¡Ajustado para el modal!)
    menuLinks.forEach(link => {
        // Asegurarse de que este event listener solo afecte a enlaces que NO son toggles de submenú
        if (!link.classList.contains('submenu-toggle')) {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir la navegación predeterminada
                const targetId = link.getAttribute('href');

                // Si el enlace es 'Subir carga', mostramos el modal en lugar de la sección
                if (targetId === '#subir') {
                    // Ocultar todas las secciones primero
                    sections.forEach(section => { section.style.display = 'none'; });
                    // Mostrar el modal
                    accessModal.style.display = 'flex'; // Usamos 'flex' para centrarlo con CSS
                    // Quitar active de todos los enlaces del menú
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active'); // Marcar "Subir carga" como activo
                } else {
                    // Para los demás enlaces, mostramos la sección normalmente
                    showSection(targetId);

                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

                    // Asegurarse de que el submenú padre se mantenga abierto y activo
                    const parentSubmenu = link.closest('.submenu');
                    if (parentSubmenu) {
                        const parentToggle = parentSubmenu.previousElementSibling; // El elemento 'a.submenu-toggle' antes del submenú
                        if (parentToggle && !parentToggle.classList.contains('active')) {
                            parentToggle.classList.add('active');
                            parentSubmenu.classList.add('active'); // Asegura que el submenú se mantenga abierto
                        }
                    }
                }
            });
        }
    });

    // ** CRUCIAL: Eliminar o comentar la inicialización de la primera sección **
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


    // --------------------------------------------------------------------
    // Lógica del Modal (¡NUEVO Y COMPLETO!)
    // --------------------------------------------------------------------

    // Cerrar el modal al hacer clic en la "x"
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            accessModal.style.display = 'none';
        });
    }

    // Cerrar el modal si se hace clic fuera del contenido del modal
    if (accessModal) {
        accessModal.addEventListener('click', (event) => {
            if (event.target === accessModal) {
                accessModal.style.display = 'none';
            }
        });
    }

    // Manejar el envío del formulario del modal (Frontend solamente por ahora)
    if (accessForm) {
        accessForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevenir el envío normal del formulario

            const username = usernameInput.value;
            const password = passwordInput.value;

            console.log('Datos de acceso capturados:');
            console.log('Usuario:', username);
            // console.log('Contraseña:', password); // Por seguridad, no imprimas la contraseña en consolas de producción

            // En un entorno real, aquí se haría la llamada a tu API de backend.
            // Por ahora, solo simularemos la acción y cerraremos el modal.
            alert('Usuario y Contraseña capturados. (En un entorno real, esto se enviaría a tu servidor)');
            
            // Limpiar el formulario y cerrar el modal
            accessForm.reset();
            accessModal.style.display = 'none';
        });
    }
    // --------------------------------------------------------------------
    // FIN Lógica del Modal
    // --------------------------------------------------------------------
});