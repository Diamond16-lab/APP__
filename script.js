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

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = toggle.nextElementSibling;
      submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    });
  });

  cargarBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
  });

  closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });

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

  const checkLogin = async (username, password) => {
    try {
      const res = await fetch('https://v1.nocodeapi.com/petronexusapp/google_sheets/mMgBADSciCQrcPLD?tabId=Usuarios', {
        method: 'GET',
      });

      const result = await res.json();
      const rows = result.data;

      for (let i = 0; i < rows.length; i++) {
      const usuario = rows[i]["Usuario"].trim();      // nota el espacio después de "Usuario "
      const contrasena = rows[i]["Contraseña"].trim();

      if (usuario === username && contrasena === password) {
        return true;
      
        }
      }

      return false;
    } catch (err) {
      console.error('Error al validar usuario:', err);
      return false;
    }
  };
});
