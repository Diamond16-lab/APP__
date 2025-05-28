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
            
            // Cuando se hace clic en el toggle del submenú, si no es para mostrar un modal,
            // se debe mostrar la sección principal asociada.
            const targetId = toggle.getAttribute('href');
            // SOLO mostramos la sección si no estamos activando un modal (no tiene #subir o #reportes)
            if (targetId !== '#subir' && targetId !== '#reportes') {
                showSection(targetId);
            }
            
            // Remover 'active' de todos los enlaces de sección y añadirlo al actual para resaltado visual
            menuLinks.forEach(item => item.classList.remove('active'));
            toggle.classList.add('active'); // El toggle también se resalta como activo.
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

                    // Asegura que el submenú padre se mantenga abierto y su flecha hacia arriba
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

                    // Al hacer clic en un elemento que no es un modal (ej. #usuarios),
                    // asegúrate de que el submenú de "Carga gasolina" esté cerrado
                    // y su flecha apunte hacia abajo.
                    submenuToggles.forEach(toggle => {
                        const submenu = toggle.closest('li.has-submenu').querySelector('.submenu');
                        if (submenu && submenu.classList.contains('active')) {
                            submenu.classList.remove('active');
                            toggle.classList.remove('active'); // Quita la clase 'active' para que la flecha se invierta
                        }
                    });
                }
            });
        }
    });

    // --------------------------------------------------------------------
    // INICIALIZACIÓN DE LA PÁGINA (¡AJUSTE CRÍTICO AQUÍ!)
    // --------------------------------------------------------------------
    // Al cargar la página:
    // 1. Mostrar la sección inicial (ej. "Carga gasolina").
    // 2. Asegurar que el modal esté oculto.
    // 3. Asegurar que la flecha del submenú de "Carga gasolina" esté hacia abajo.

    const initialSectionLink = document.querySelector('.menu a[href="#carga"]');
    if (initialSectionLink) {
        showSection(initialSectionLink.getAttribute('href'));
        // No añadimos la clase 'active' al initialSectionLink aquí,
        // ya que es el toggle del submenú y queremos que la flecha esté hacia abajo.
        // Solo si la sección fuera #carga misma y no un toggle para submenú, lo haríamos.
    }

    // Asegúrate de que el modal esté oculto al inicio
    accessModal.style.display = 'none';

    // Asegúrate de que todos los submenús estén cerrados y sus flechas hacia abajo al inicio
    submenuToggles.forEach(toggle => {
        const submenu = toggle.closest('li.has-submenu').querySelector('.submenu');
        if (submenu) {
            submenu.classList.remove('active'); // Asegura que el submenú esté cerrado
            toggle.classList.remove('active');   // Asegura que la flecha apunte hacia abajo
        }
    });

    // Si quieres que "Carga gasolina" esté resaltada inicialmente
    // sin que su flecha esté invertida, podemos añadir 'active' solo al texto o al li,
    // o manejarlo de forma separada del toggle de flecha.
    // Por ahora, solo nos aseguramos que no invierta la flecha.
    // Puedes considerar añadir una clase 'initial-active' o similar para resaltar la entrada
    // del menú "Carga gasolina" si es la sección predeterminada que se muestra,
    // sin que afecte la flecha del submenú si está cerrado.
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