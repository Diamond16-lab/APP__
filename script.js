
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaR5wsu1blavmv_r588fp7ZHEoYRlNjxc",
  authDomain: "petronexus-4a1a8.firebaseapp.com",
  projectId: "petronexus-4a1a8",
  storageBucket: "petronexus-4a1a8.firebasestorage.app",
  messagingSenderId: "854333259825",
  appId: "1:854333259825:web:8815ec5bcad36ec6985510"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

  // Toggle sidebar
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }

  // Toggle submenus
  submenuToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = toggle.nextElementSibling;
      submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
    });
  });

  // Mostrar modal login
  if (cargarBtn) {
    cargarBtn.addEventListener('click', () => {
      loginModal.style.display = 'block';
    });
  }

  // Cerrar modal login
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
  }

  // Autenticación
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const pass = document.getElementById('password').value;

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert('Acceso concedido');
        loginModal.style.display = 'none';
        formularioSection.style.display = 'block';
      } catch (err) {
        alert('Credenciales incorrectas');
        console.error(err);
      }
    });
  }

  // Guardar en Firestore
  if (gasolinaForm) {
    gasolinaForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(gasolinaForm);
      const data = {
        fecha: formData.get("fecha"),
        vehiculo: formData.get("vehiculo"),
        kilometraje: formData.get("kilometraje"),
        litros: formData.get("litros"),
        precio: formData.get("precio"),
        timestamp: new Date()
      };

      try {
        await addDoc(collection(db, "cargas"), data);
        alert("Carga registrada correctamente");
        gasolinaForm.reset();
      } catch (err) {
        console.error("Error al guardar en Firestore:", err);
        alert("Hubo un error al guardar la carga");
      }
    });
  }
});
