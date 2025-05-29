
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
  const loginForm = document.getElementById('loginForm');
  const operadorForm = document.getElementById('operadorForm');
  const loginSection = document.getElementById('loginSection');
  const formSection = document.getElementById('formularioOperador');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const pass = document.getElementById('password').value;

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        alert('Acceso concedido');
        loginSection.style.display = 'none';
        formSection.style.display = 'block';
      } catch (err) {
        alert('Credenciales incorrectas');
        console.error(err);
      }
    });
  }

  if (operadorForm) {
    operadorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(operadorForm));
      data.timestamp = new Date();

      try {
        await addDoc(collection(db, "registros_operadores"), data);
        alert("Reporte guardado correctamente");
        operadorForm.reset();
      } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error al guardar el reporte");
      }
    });
  }
});
