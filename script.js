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
    // TU CÓDIGO PARA EL SIDEBAR Y CAMBIO DE SECCIONES (AJUSTADO)
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a'); // Selecciona TODOS los enlaces del menú
    const sections = document.querySelectorAll('main section');

    // Referencias al modal
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

    // Lógica para menús desplegables
    const submenuToggles = document.querySelectorAll('.submenu-toggle');

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault(); // Evita la navegación predeterminada para el toggle

            const parentLi = toggle.closest('li.has-submenu');
            if (parentLi) {
                const submenu = parentLi.querySelector('.submenu');
                if (submenu) {
                    submenu.classList.toggle('active');
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
            
            // También se debe mostrar la sección principal de "Carga gasolina"
            // cuando se despliega el submenú.
            const targetId = toggle.getAttribute('href');
            showSection(targetId);
            
            // Remover 'active' de todos y añadirlo al actual para resaltado visual
            menuLinks.forEach(item => item.classList.remove('active'));
            toggle.classList.add('active');
        });
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
        // IMPORTANTE: Asegurarse de que el modal esté oculto cuando se muestre una sección
        if (accessModal.style.display === 'flex') {
            accessModal.style.display = 'none';
        }
    };

    // Manejar clics en los enlaces del menú (incluyendo los del submenú)
    menuLinks.forEach(link => {
        // Excluimos los 'submenu-toggle' porque su lógica ya está arriba
        if (!link.classList.contains('submenu-toggle')) {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir la navegación predeterminada
                const targetId = link.getAttribute('href');

                // LÓGICA PRINCIPAL: Mostrar el modal si el clic es en '#subir' O '#reportes'
                if (targetId === '#subir' || targetId === '#reportes') { // <-- ¡CAMBIO AQUÍ!
                    // Ocultar todas las secciones antes de mostrar el modal
                    sections.forEach(section => { section.style.display = 'none'; });
                    accessModal.style.display = 'flex'; // Muestra el modal

                    // Asegura que el enlace clickeado esté visualmente activo
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

                    // Asegura que el submenú padre se mantenga abierto si se cerró por algún clic externo
                    const parentSubmenu = link.closest('.submenu');
                    if (parentSubmenu) {
                        const parentToggle = parentSubmenu.previousElementSibling;
                        if (parentToggle && !parentToggle.classList.contains('active')) {
                            parentToggle.classList.add('active');
                            parentSubmenu.classList.add('active');
                        }
                    }

                } else {
                    // Para cualquier otro enlace que no sea 'Subir carga' o 'Reportes', muestra su sección correspondiente
                    showSection(targetId);

                    // Actualiza el estado activo en el sidebar
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

                    // Asegura que el submenú padre se mantenga abierto si se cerró por algún clic externo
                    const parentSubmenu = link.closest('.submenu');
                    if (parentSubmenu) {
                        const parentToggle = parentSubmenu.previousElementSibling;
                        if (parentToggle && !parentToggle.classList.contains('active')) {
                            parentToggle.classList.add('active');
                            parentSubmenu.classList.add('active');
                        }
                    }
                }
            });
        }
    });

    // Inicializar la página: Mostrar la primera sección (Carga gasolina) al cargar
    // y asegurar que el modal NO aparezca.
    const initialSectionLink = document.querySelector('.menu a[href="#carga"]');
    if (initialSectionLink) {
        showSection(initialSectionLink.getAttribute('href'));
        initialSectionLink.classList.add('active');
        // Asegúrate de que el modal esté oculto al inicio
        accessModal.style.display = 'none';
    }
    // --------------------------------------------------------------------
    // FIN DEL CÓDIGO PARA EL SIDEBAR Y SECCIONES
    // --------------------------------------------------------------------


    // --------------------------------------------------------------------
    // Lógica del Modal (COMPLETO Y SIN CAMBIOS)
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
            if (event.target === accessModal) { // Solo cierra si el clic fue en el overlay, no en el contenido
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
            // console.log('Contraseña:', password); // Por seguridad, NO imprimas la contraseña en consolas de producción

            // En un entorno real, aquí se haría la llamada a tu API de backend.
            // Por ahora, solo simularemos la acción y cerraremos el modal.
            alert('Usuario y Contraseña capturados. (En un entorno real, esto se enviaría a tu servidor)');
            
            // Limpiar el formulario y cerrar el modal
            accessForm.reset();
            accessModal.style.display = 'none';
        });
    }
    // --------------------------------------------------------------------\
    // FIN Lógica del Modal
    // --------------------------------------------------------------------\
});