document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------
    // CÓDIGO PARA EL REGISTRO DEL SERVICE WORKER
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
    // TU CÓDIGO PARA EL SIDEBAR Y CAMBIO DE SECCIONES
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a');
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
            event.preventDefault();

            const parentLi = toggle.closest('li.has-submenu');
            if (parentLi) {
                const submenu = parentLi.querySelector('.submenu');
                if (submenu) {
                    submenu.classList.toggle('active');
                    toggle.classList.toggle('active');

                    // Cerrar otros submenús
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
        if (!link.classList.contains('submenu-toggle')) {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir la navegación predeterminada
                const targetId = link.getAttribute('href');

                // Si el enlace es 'Subir carga', mostramos el modal en lugar de la sección
                if (targetId === '#subir') {
                    // Ocultar todas las secciones primero
                    sections.forEach(section => { section.style.display = 'none'; });
                    // Mostrar el modal
                    accessModal.style.display = 'flex';
                    // Quitar active de todos los enlaces del menú
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active'); // Marcar "Subir carga" como activo
                } else {
                    // Para los demás enlaces, mostramos la sección normalmente
                    showSection(targetId);

                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

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

    // No mostrar ninguna sección al cargar la página (mantenemos esto)
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
    // Lógica del Modal (¡NUEVO!)
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

    // Manejar el envío del formulario del modal
    if (accessForm) {
        accessForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevenir el envío normal del formulario

            const username = usernameInput.value;
            const password = passwordInput.value;

            console.log('Intentando enviar datos de acceso:');
            console.log('Usuario:', username);
            console.log('Contraseña:', password); // En un entorno real, no loguearías la contraseña así.

            // --------------------------------------------------------------
            // IMPORTANTE: ESTA ES LA PARTE DEL BACKEND (PARA ALMACENAR EN DB)
            // --------------------------------------------------------------
            // Aquí es donde necesitarías enviar estos datos a tu servidor (backend).
            // El backend los recibiría y los guardaría en la base de datos.
            // Para fines de este ejemplo, simularemos una llamada a la API.

            try {
                // Simulación de una llamada a una API de backend
                // En un entorno real, reemplazarías 'YOUR_BACKEND_API_ENDPOINT'
                // con la URL de tu servidor (ej. 'http://localhost:3000/api/access')
                const response = await fetch('YOUR_BACKEND_API_ENDPOINT/register-access', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Acceso registrado con éxito:', data);
                    alert('Acceso registrado con éxito!');
                    accessModal.style.display = 'none'; // Cerrar modal después de éxito
                    accessForm.reset(); // Limpiar el formulario
                } else {
                    const errorData = await response.json();
                    console.error('Error al registrar acceso:', errorData.message);
                    alert('Error al registrar acceso: ' + errorData.message);
                }
            } catch (error) {
                console.error('Fallo la conexión con el servidor:', error);
                alert('No se pudo conectar con el servidor para registrar el acceso.');
            }
            // --------------------------------------------------------------
        });
    }
    // --------------------------------------------------------------------
    // FIN Lógica del Modal
    // --------------------------------------------------------------------
});