<template>
    <div class="d-flex justify-content-center align-items-center min-vh-100">
      <div class="card card-home">
        <div class="p-4 shadow-sm rounded-3 bg-white text-center">
          <Logo />
          <h2 class="mb-4">Menú Principal</h2>

          <BaseButton
            label="Crear Sala"
            action="createRoom"
            variant="primary"
            @click="handleCrearSala"
            class="w-100 my-2"
          />

          <BaseButton
            label="Unirse a Sala"
            action="joinRoom"
            variant="success"
            @click="handleUnirseSala"
            class="w-100 my-2"
          />

          <BaseButton
            label="Cerrar Sesión"
            action="logout"
            variant="danger"
            @click="handleCerrarSesion"
            class="w-100 mt-4"
          />
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { useRouter } from 'vue-router';
  import Swal from 'sweetalert2';
  import BaseButton from '../components/BaseButton.vue';
  import Logo from '../components/Logo.vue';
  import { AuthService } from "../firebase/auth.js";
  const router = useRouter();

  const handleCrearSala = () => {
    // Lógica para crear sala (puedes redirigir a otra vista o mostrar modal)
    Swal.fire({
      title: 'Crear Nueva Sala',
      text: '¿Deseas crear una nueva sala de juego?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push({ name: 'create-game' }); // Asegúrate de tener esta ruta configurada
      }
    });
  };

  const handleUnirseSala = () => {
    // Redirige directamente a la vista JoinGame
    router.push({ name: 'joingame' });
  };

  const handleCerrarSesion = () => {
    Swal.fire({
      title: 'Cerrar Sesión',
      text: '¿Estás seguro que deseas salir?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const result = await AuthService.logout();
          if (result.success) {
            router.push("/login");
          } else {
            console.error(result.error);
            router.push("/");
          }
        } catch (error) {
          console.error("Error al cerrar sesión:", error.message);
        }
      }
    });
  };
  </script>

  <style scoped>
  .card-home {
    width: 100%;
    max-width: 400px;
  }

  h2 {
    color: #333;
    font-weight: 600;
  }
  </style>