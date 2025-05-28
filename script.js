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
                    const isSubmenuActive = submenu.classList.contains('active');

                    // Cerrar todos los demás submenús y resetear sus flechas
                    submenuToggles.forEach(otherToggle => {
                        const otherParentLi = otherToggle.closest('li.has-submenu');
                        if (otherParentLi) {
                            const otherSubmenu = otherParentLi.querySelector('.submenu');
                            if (otherSubmenu && otherSubmenu.classList.contains('active')) {
                                otherSubmenu.classList.remove('active');
                                otherToggle.classList.remove('active'); // Quita la clase 'active' para que su flecha se invierta
                            }
                        }
                    });

                    // Si el submenú en el que se hizo clic NO estaba activo, ábrelo
                    if (!isSubmenuActive) {
                        submenu.classList.add('active');
                        toggle.classList.add('active'); // Añade la clase 'active' para rotar la flecha
                    } else {
                        // Si SÍ estaba activo, ciérralo
                        submenu.classList.remove('active');
                        toggle.classList.remove('active'); // Quita la clase 'active' para que la flecha vuelva a su posición original
                    }
                }
            }
            
            // Remover 'active' de todos los enlaces de sección y añadirlo al actual para resaltado visual
            // (Esto se aplica a los enlaces directos, no a los toggles de submenú si solo quieres resaltar secciones)
            // menuLinks.forEach(item => item.classList.remove('active'));
            // toggle.classList.add('active'); // Comentado, ya que el toggle en sí no es una "sección" para resaltar
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
                if (targetId === '#subir' || targetId === '#reportes') {
                    // Ocultar todas las secciones antes de mostrar el modal
                    sections.forEach(section => { section.style.display = 'none'; });
                    accessModal.style.display = 'flex'; // Muestra el modal

                    // Asegura que el enlace clickeado esté visualmente activo
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

                    // Asegura que el submenú padre esté abierto y su flecha hacia arriba
                    const parentSubmenu = link.closest('.submenu');
                    if (parentSubmenu) {
                        parentSubmenu.classList.add('active');
                        const parentToggle = parentSubmenu.previousElementSibling;
                        if (parentToggle) {
                            parentToggle.classList.add('active'); // Esto asegura que la flecha se rote hacia arriba
                        }
                    }

                } else {
                    // Para cualquier otro enlace que no sea 'Subir carga' o 'Reportes', muestra su sección correspondiente
                    showSection(targetId);

                    // Actualiza el estado activo en el sidebar
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

                    // Cerrar todos los submenús y resetear sus flechas si se hace clic en un enlace que no es parte de ellos
                    const isSubmenuItem = link.closest('.submenu');
                    if (!isSubmenuItem) {
                        submenuToggles.forEach(toggle => {
                            const submenu = toggle.closest('li.has-submenu').querySelector('.submenu');
                            if (submenu && submenu.classList.contains('active')) {
                                submenu.classList.remove('active');
                                toggle.classList.remove('active'); // Quita la clase 'active' para que la flecha se invierta
                            }
                        });
                    } else {
                        // Si es un subelemento, asegura que el submenú padre se mantenga abierto
                        const parentSubmenu = link.closest('.submenu');
                        if (parentSubmenu) {
                            parentSubmenu.classList.add('active');
                            const parentToggle = parentSubmenu.previousElementSibling;
                            if (parentToggle) {
                                parentToggle.classList.add('active');
                            }
                        }
                    }
                }
            });
        }
    });

    // --------------------------------------------------------------------
    // INICIALIZACIÓN DE LA PÁGINA (¡AJUSTES PARA MODAL Y FLECHA!)
    // --------------------------------------------------------------------
    // Al cargar la página:
    // 1. Mostrar la sección inicial (Carga gasolina).
    // 2. Asegurarse de que todos los submenús estén cerrados y sus flechas hacia abajo.

    // No es necesario ocultar el modal aquí con JS si ya lo ocultamos en CSS.
    // accessModal.style.display = 'none'; // Esta línea ahora es redundante si está en CSS.

    // Mostrar la sección inicial (Carga gasolina)
    const initialSectionLink = document.querySelector('.menu a[href="#carga"]');
    if (initialSectionLink) {
        showSection(initialSectionLink.getAttribute('href')); // Muestra la sección #carga
        // Asegurar que el enlace del submenú principal (Carga gasolina) esté activo si quieres resaltarlo
        // initialSectionLink.classList.add('active'); // Puedes descomentar si quieres que esté resaltado al inicio
    } else {
        // En caso de que #carga no exista o no sea la primera, mostrar la primera sección disponible
        if (sections.length > 0) {
            showSection(`#${sections[0].id}`);
            const firstLink = document.querySelector(`.menu a[href="#${sections[0].id}"]`);
            if (firstLink && !firstLink.classList.contains('submenu-toggle')) {
                firstLink.classList.add('active');
            }
        }
    }

    // Asegúrate de que TODOS los submenús estén cerrados y sus flechas hacia abajo al inicio
    // Iteramos sobre todos los toggles para asegurar que todos estén cerrados.
    submenuToggles.forEach(toggle => {
        const parentLi = toggle.closest('li.has-submenu');
        if (parentLi) {
            const submenu = parentLi.querySelector('.submenu');
            if (submenu) {
                submenu.classList.remove('active'); // Asegura que el submenú esté cerrado
            }
        }
        toggle.classList.remove('active');   // Asegura que la flecha apunte hacia abajo
    });

    // --------------------------------------------------------------------
    // FIN DE LA INICIALIZACIÓN
    // --------------------------------------------------------------------


    // --------------------------------------------------------------------
    // Lógica del Modal (COMPLETO Y SIN CAMBIOS FUNCIONALES MAYORES)
    // --------------------------------------------------------------------

    // Cerrar el modal al hacer clic en la "x"
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            accessModal.style.display = 'none';
            // También puedes resetear el formulario aquí si lo deseas
            accessForm.reset();
        });
    }

    // Cerrar el modal si se hace clic fuera del contenido del modal
    if (accessModal) {
        accessModal.addEventListener('click', (event) => {
            if (event.target === accessModal) { // Solo cierra si el clic fue en el overlay, no en el contenido
                accessModal.style.display = 'none';
                accessForm.reset(); // Limpiar el formulario al cerrar el modal
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
    // --------------------------------------------------------------------
    // FIN Lógica del Modal
    // --------------------------------------------------------------------
});