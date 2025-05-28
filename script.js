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
    // CONSTANTES Y VARIABLES GLOBALES
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a');
    const sections = document.querySelectorAll('main section');

    // Referencias al modal de acceso
    const accessModal = document.getElementById('accessModal');
    const closeButton = document.querySelector('.close-button');
    const accessForm = document.getElementById('accessForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Referencias para la nueva sección de logs
    const adminLogsSection = document.getElementById('admin-logs');
    const refreshLogsBtn = document.getElementById('refreshLogsBtn');
    const logsContainer = document.getElementById('logsContainer');

    // URL base de tu backend. ¡CAMBIA ESTO CUANDO DESPLIEGUES TU BACKEND!
    const BACKEND_URL = 'http://localhost:5000'; // O la URL de tu backend desplegado (ej. https://your-backend.heroku.app)

    let currentUserRole = null; // Para guardar el rol del usuario actual

    // --------------------------------------------------------------------
    // FUNCIONES AUXILIARES
    // --------------------------------------------------------------------

    // Función para mostrar la sección activa y ocultar las demás
    const showSection = (targetId) => {
        sections.forEach(section => {
            if (`#${section.id}` === targetId) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
        // Asegurarse de que el modal esté oculto cuando se muestra una sección
        if (accessModal.style.display === 'flex') {
            accessModal.style.display = 'none';
        }
    };

    // Función para actualizar el estado visual del sidebar
    const updateSidebarActiveLink = (targetId) => {
        menuLinks.forEach(item => item.classList.remove('active'));
        const activeLink = document.querySelector(`.menu a[href="${targetId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    };

    // Función para cerrar todos los submenús
    const closeAllSubmenus = () => {
        document.querySelectorAll('.submenu.active').forEach(submenu => {
            submenu.classList.remove('active');
        });
        document.querySelectorAll('.submenu-toggle.active').forEach(toggle => {
            toggle.classList.remove('active');
        });
    };

    // Función para cargar los logs de acceso (solo para admin)
    const loadAccessLogs = async () => {
        if (!logsContainer) return; // Si el contenedor no existe, salir

        logsContainer.innerHTML = '<p>Cargando logs...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/api/access-logs`);
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logsContainer.innerHTML = '<p>No tienes permiso para ver los logs de acceso o no has iniciado sesión como administrador.</p>';
                } else {
                    logsContainer.innerHTML = '<p>Error al cargar los logs de acceso.</p>';
                }
                return;
            }
            const logs = await response.json();

            if (logs.length === 0) {
                logsContainer.innerHTML = '<p>No hay registros de acceso aún.</p>';
                return;
            }

            let logsHtml = '<ul>';
            logs.forEach(log => {
                const date = new Date(log.accessTime).toLocaleString('es-MX', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                logsHtml += `<li><strong>Usuario:</strong> ${log.username} | <strong>Fecha/Hora:</strong> ${date} | <strong>IP:</strong> ${log.ipAddress || 'N/A'}</li>`;
            });
            logsHtml += '</ul>';
            logsContainer.innerHTML = logsHtml;

        } catch (error) {
            console.error('Error al cargar logs:', error);
            logsContainer.innerHTML = '<p>Error de red o servidor al cargar los logs.</p>';
        }
    };

    // --------------------------------------------------------------------
    // LÓGICA DE EVENTOS Y FUNCIONALIDAD
    // --------------------------------------------------------------------

    // Toggle del sidebar
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
                    const isSubmenuActive = submenu.classList.contains('active');

                    // Cerrar todos los demás submenús y resetear sus flechas
                    closeAllSubmenus();

                    // Si el submenú en el que se hizo clic NO estaba activo, ábrelo
                    if (!isSubmenuActive) {
                        submenu.classList.add('active');
                        toggle.classList.add('active');
                    }
                }
            }
        });
    });

    // Manejar clics en los enlaces del menú
    menuLinks.forEach(link => {
        if (!link.classList.contains('submenu-toggle')) { // Excluir los toggles de submenú
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                const targetId = link.getAttribute('href');

                // LÓGICA DE ACCESO: Si es 'Subir carga' o 'Reportes' Y NO HAY ROL ASIGNADO (no logueado)
                // Se modificó para que el modal de acceso aparezca siempre primero,
                // y que solo se muestren #subir o #reportes DESPUÉS de un acceso exitoso.
                if ((targetId === '#subir' || targetId === '#reportes') && !currentUserRole) {
                    // Si el usuario no ha iniciado sesión, mostrar el modal
                    sections.forEach(section => { section.style.display = 'none'; }); // Oculta todas las secciones
                    accessModal.style.display = 'flex'; // Muestra el modal
                    updateSidebarActiveLink(targetId); // Marcar el enlace en el sidebar
                    closeAllSubmenus(); // Asegura que los submenús estén cerrados
                } else if (targetId === '#admin-logs') {
                    // Si es la sección de logs de admin, requerir rol 'admin'
                    if (currentUserRole === 'admin') {
                        showSection(targetId);
                        updateSidebarActiveLink(targetId);
                        closeAllSubmenus();
                        await loadAccessLogs(); // Cargar los logs cuando se muestra la sección
                    } else {
                        alert('Acceso denegado: Esta sección es solo para administradores.');
                        // Opcional: mostrar modal de acceso si no hay sesión
                        if (!currentUserRole) {
                            sections.forEach(section => { section.style.display = 'none'; });
                            accessModal.style.display = 'flex';
                            updateSidebarActiveLink(targetId);
                            closeAllSubmenus();
                        }
                    }
                }
                else {
                    // Para cualquier otro enlace, simplemente mostrar la sección
                    showSection(targetId);
                    updateSidebarActiveLink(targetId);
                    closeAllSubmenus();
                }
            });
        }
    });

    // Manejar clic en el botón de actualizar logs
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', async () => {
            if (currentUserRole === 'admin') {
                await loadAccessLogs();
            } else {
                alert('No tienes permiso para actualizar los logs de acceso.');
            }
        });
    }

    // Lógica del Modal
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            accessModal.style.display = 'none';
            accessForm.reset();
        });
    }

    if (accessModal) {
        accessModal.addEventListener('click', (event) => {
            if (event.target === accessModal) {
                accessModal.style.display = 'none';
                accessForm.reset();
            }
        });
    }

    // Manejar el envío del formulario del modal (¡Ahora se conecta al backend!)
    if (accessForm) {
        accessForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch(`${BACKEND_URL}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('Acceso exitoso:', data);
                    alert(data.message);

                    currentUserRole = data.user.role; // Almacena el rol del usuario

                    accessModal.style.display = 'none';
                    accessForm.reset();

                    // Después de un acceso exitoso, muestra la sección "Subir carga"
                    showSection('#subir');
                    updateSidebarActiveLink('#subir');

                    // Opcional: Ocultar o mostrar elementos del menú basados en el rol
                    updateMenuVisibilityByRole(currentUserRole);

                } else {
                    const errorData = await response.json();
                    console.error('Error al iniciar sesión:', errorData.message);
                    alert('Error de acceso: ' + errorData.message);
                    // Opcional: No cerrar el modal en caso de error para que el usuario pueda reintentar
                }
            } catch (error) {
                console.error('Fallo la conexión con el servidor:', error);
                alert('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.');
            }
        });
    }

    // --------------------------------------------------------------------
    // FUNCIÓN PARA GESTIONAR VISIBILIDAD DE MENÚ POR ROL
    // --------------------------------------------------------------------
    const updateMenuVisibilityByRole = (role) => {
        const adminLogsLink = document.querySelector('.menu a[href="#admin-logs"]').closest('li');
        const usuariosLink = document.querySelector('.menu a[href="#usuarios"]').closest('li');
        
        if (adminLogsLink) {
            adminLogsLink.style.display = (role === 'admin') ? 'block' : 'none';
        }
        if (usuariosLink) {
            usuariosLink.style.display = (role === 'admin') ? 'block' : 'none';
        }
    };


    // --------------------------------------------------------------------
    // INICIALIZACIÓN DE LA PÁGINA
    // --------------------------------------------------------------------
    // Al cargar la página, se muestra la sección de "Carga gasolina" por defecto
    // Pero si #subir o #reportes son clicadas inicialmente, el modal aparecerá.
    // Ocultar todas las secciones al inicio y esperar la interacción del usuario
    sections.forEach(section => { section.style.display = 'none'; });

    // Mostrar la sección inicial de "Carga gasolina"
    showSection('#carga');
    updateSidebarActiveLink('#carga');
    closeAllSubmenus();

    // Al inicio, ocultar secciones de admin si el usuario no ha iniciado sesión
    updateMenuVisibilityByRole(currentUserRole); // currentUserRole será null al inicio
});