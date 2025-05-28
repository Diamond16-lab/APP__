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
                    toggle.classList.toggle('active'); // Esto añade/remueve la clase 'active' al toggle, lo que rota la flecha.

                    // Cerrar otros submenús si solo quieres uno abierto a la vez
                    submenuToggles.forEach(otherToggle => {
                        if (otherToggle !== toggle) {
                            const otherParentLi = otherToggle.closest('li.has-submenu');
                            if (otherParentLi) {
                                const otherSubmenu = otherParentLi.querySelector('.submenu');
                                if (otherSubmenu && otherSubmenu.classList.contains('active')) {
                                    otherSubmenu.classList.remove('active');
                                    otherToggle.classList.remove('active'); // Quita la clase 'active' para que su flecha se invierta
                                }
                            }
                        }
                    });
                }
            }
            
            // Cuando se hace clic en el toggle del submenú, si no es para mostrar un modal,
            // se debe mostrar la sección principal asociada.
            const targetId = toggle.getAttribute('href');
            // SOLO mostramos la sección si no estamos activando un modal (no tiene #subir o #reportes)
            // Ya que #carga es un toggle, no queremos que muestre directamente la sección #carga si no se clickea en ella explícitamente.
            // La sección #carga se mostrará por defecto al cargar la página.
            // Este `if` es solo para evitar que un click en el toggle de '#carga' muestre la sección #carga de nuevo.
            if (targetId !== '#subir' && targetId !== '#reportes') {
                // showSection(targetId); // Comentado para evitar que el toggle cambie la sección
            }
            
            // Remover 'active' de todos los enlaces de sección y añadirlo al actual para resaltado visual
            // (esto se aplica a los enlaces directos, no a los toggles de submenú si solo quieres resaltar secciones)
            // menuLinks.forEach(item => item.classList.remove('active'));
            // toggle.classList.add('active'); // No añadir 'active' al toggle principal, solo al submenú si está activo
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
                        const parentToggle = parentSubmenu.previousElementSibling;
                        if (parentToggle) {
                            parentSubmenu.classList.add('active');
                            parentToggle.classList.add('active'); // Esto asegura que la flecha se rote hacia arriba
                        }
                    }

                } else {
                    // Para cualquier otro enlace que no sea 'Subir carga' o 'Reportes', muestra su sección correspondiente
                    showSection(targetId);

                    // Actualiza el estado activo en el sidebar
                    menuLinks.forEach(item => item.classList.remove('active'));
                    link.classList.add('active');

                    // Asegura que el submenú padre esté cerrado y su flecha hacia abajo
                    // Si el enlace clicado no es un subelemento de 'Carga gasolina'
                    const isInsideSubmenu = link.closest('.submenu');
                    if (!isInsideSubmenu) {
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
                            const parentToggle = parentSubmenu.previousElementSibling;
                            if (parentToggle) {
                                parentSubmenu.classList.add('active');
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
    // 1. Asegurar que el modal esté oculto *inmediatamente*.
    // 2. Mostrar la sección inicial (ej. "Carga gasolina").
    // 3. Asegurar que todos los submenús estén cerrados y sus flechas hacia abajo.

    // 1. Ocultar el modal al inicio (antes de mostrar cualquier sección)
    accessModal.style.display = 'none';

    // 2. Mostrar la sección inicial (Carga gasolina)
    const initialSectionLink = document.querySelector('.menu a[href="#carga"]');
    if (initialSectionLink) {
        showSection(initialSectionLink.getAttribute('href')); // Muestra la sección #carga
        // No añadimos 'active' al initialSectionLink aquí, ya que es el toggle del submenú
        // y queremos que su flecha esté hacia abajo por defecto (submenú cerrado).
        // Podemos resaltar el enlace de otra manera si se desea que aparezca "activo"
        // incluso cuando el submenú está cerrado. Por ahora, nos enfocamos en la flecha.
    } else {
        // En caso de que #carga no exista, mostrar la primera sección disponible
        if (sections.length > 0) {
            showSection(`#${sections[0].id}`);
            const firstLink = document.querySelector(`.menu a[href="#${sections[0].id}"]`);
            if (firstLink && !firstLink.classList.contains('submenu-toggle')) {
                firstLink.classList.add('active');
            }
        }
    }

    // 3. Asegúrate de que todos los submenús estén cerrados y sus flechas hacia abajo al inicio
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
    // Lógica del Modal (COMPLETO Y SIN CAMBIOS FUNCIONALES)
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
    // --------------------------------------------------------------------
    // FIN Lógica del Modal
    // --------------------------------------------------------------------
});