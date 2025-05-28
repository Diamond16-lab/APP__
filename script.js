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
    // CÓDIGO PARA EL SIDEBAR Y CAMBIO DE SECCIONES (¡Completo!)
    // --------------------------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    const menuLinks = document.querySelectorAll('.menu a'); // Selecciona todos los enlaces de menú
    const sections = document.querySelectorAll('main section'); // Selecciona todas las secciones de contenido

    // Función para alternar la visibilidad del sidebar
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Lógica para menús desplegables
    const submenuToggles = document.querySelectorAll('.submenu-toggle'); // Selecciona los enlaces que abren submenús

    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            const parentLi = toggle.closest('li.has-submenu'); // Encuentra el <li> padre con la clase
            if (parentLi) {
                const submenu = parentLi.querySelector('.submenu'); // Encuentra el <ul>.submenu dentro
                if (submenu) {
                    event.preventDefault(); // Previene que el enlace #carga navegue
                    
                    // Alternar la clase 'active' para desplegar/contraer el submenú
                    submenu.classList.toggle('active');
                    // Alternar la clase 'active' en el propio toggle para rotar la flecha
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

    // Función para mostrar la sección activa y ocultar las demás
    const showSection = (targetId) => {
        sections.forEach(section => {
            if (`#${section.id}` === targetId.substring(1)) { // Comparar solo el ID (sin el #)
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    };

    // Manejar clics en los enlaces del menú (incluyendo los del submenú)
    menuLinks.forEach(link => {
        // Solo aplica esta lógica a los enlaces que NO son toggles de submenú
        if (!link.classList.contains('submenu-toggle')) {
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
                const targetId = link.getAttribute('href'); // Obtener el ID de la sección a mostrar
                showSection(targetId);

                // Remover 'active' de todos los enlaces y añadir al clickeado
                menuLinks.forEach(item => item.classList.remove('active'));
                link.classList.add('active');

                // Si un enlace de submenú fue clickeado, asegúrate de que el padre 'submenu-toggle' también esté 'active'
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

    // Inicializar: Mostrar la primera sección al cargar la página
    // Asegurarse de que al inicio, la sección correspondiente a '#carga' se muestre
    // Si tienes "Carga gasolina" como la primera opción, y quieres que se muestre,
    // puedes usar el href de su toggle o la primera sección de contenido.
    if (sections.length > 0) {
        // Muestra la sección que corresponde al primer enlace del menú principal, o la primera sección de contenido
        // Aquí asumimos que #carga es la primera sección de contenido que queremos ver por defecto
        showSection('#carga'); 
        // Activa el enlace correspondiente en el menú si es necesario
        const initialLink = document.querySelector('.menu a[href="#carga"]');
        if (initialLink) {
             initialLink.classList.add('active');
        }
    }
    // --------------------------------------------------------------------
    // FIN DEL CÓDIGO PARA EL SIDEBAR Y SECCIONES
    // --------------------------------------------------------------------
});