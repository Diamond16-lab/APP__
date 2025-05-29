document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const sidebar = document.getElementById('sidebar');
  const submenuToggles = document.querySelectorAll('.submenu-toggle');
  const cargarBtn = document.getElementById('cargarGasolinaBtn');
  const loginModal = document.getElementById('loginModal');
  const closeModal = document.getElementById('closeModal');
  const loginForm = document.getElementById('loginForm');
  const formularioSection = document.getElementById('formularioCarga');
  const gasolinaForm = document.getElementById('gasolinaForm');

  // SIDEBAR toggle
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // SUBMENÚ toggle
  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = toggle.nextElementSibling;
      submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    });
  });

  // Abrir el modal de login al dar clic en "Cargar gasolina"
  cargarBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
  });

  // Cerrar el modal
  closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });

  // VALIDACIÓN de acceso
  loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  const acceso = await checkLogin(user, pass);
  if (acceso) {
    alert('Acceso concedido');
    loginModal.style.display = 'none';
    formularioSection.style.display = 'block';
  } else {
    alert('Usuario o contraseña incorrectos');
  }
});

    // Llama al script y verifica credenciales contra Google Sheets
const checkLogin = async (username, password) => {
  try {
    const res = await fetch('https://script.google.com/macros/s/AKfycbzHn9WFpbnDFOS-bWEyPJQmaTVpa_sRnk1iK5-1lz2CGFJW-anw4HZZbliRSFl7hSTB/exec', {
      method: 'POST',
      body: JSON.stringify({ tipo: 'login', username, password }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const text = await res.text();
    console.log('Respuesta del servidor:', text);
    // Verifica si la respuesta es "OK"
    return text === 'OK';
  } catch (err) {
    console.error('Error al validar usuario:', err);
    return false;
  }
};


  // CONEXIÓN a Google Sheets
  const endpoint ='https://script.google.com/macros/s/AKfycbzHn9WFpbnDFOS-bWEyPJQmaTVpa_sRnk1iK5-1lz2CGFJW-anw4HZZbliRSFl7hSTB/exec'; // Reemplaza con tu endpoint de Google Sheets
  gasolinaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(gasolinaForm);
    const data = {
      fecha: formData.get("fecha"),
      vehiculo: formData.get("vehiculo"),
      kilometraje: formData.get("kilometraje"),
      litros: formData.get("litros"),
      precio: formData.get("precio")
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        alert("Carga enviada correctamente");
        gasolinaForm.reset();
      } else {
        alert("Error al enviar los datos");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  });
});
