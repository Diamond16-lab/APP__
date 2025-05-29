
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

document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".submenu-toggle");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const submenu = toggle.nextElementSibling;
      const arrow = toggle.querySelector(".arrow-icon");
      submenu.style.display = submenu.style.display === "block" ? "none" : "block";
      arrow.classList.toggle("rotate");
    });
  });

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  const loginForm = document.getElementById("loginForm");
  const loginSection = document.getElementById("loginSection");
  const subirCarga = document.getElementById("subirCargaSection");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      alert("Acceso concedido");
      loginSection.style.display = "none";
      subirCarga.style.display = "block";
    } catch (err) {
      alert("Credenciales incorrectas");
      console.error(err);
    }
  });

  const cargaForm = document.getElementById("cargaForm");
  cargaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(cargaForm);
    const data = Object.fromEntries(formData.entries());
    data.timestamp = new Date();

    try {
      await addDoc(collection(db, "cargas_combustible"), data);
      alert("Carga guardada correctamente");
      cargaForm.reset();
    } catch (err) {
      alert("Error al guardar la carga");
      console.error(err);
    }
  });
});
