<template>
    <div class="d-flex justify-content-center align-items-center min-vh-100">
      <div class="card card-join">
        <div class="p-4 shadow-sm rounded-3 bg-white">
          <!-- Componente Code -->
            <Code 
            ref="codeComponent"
            :esperando-inicio="esperandoInicio"
            @unirseAPartida="handleUnirseAPartida"></Code>
          
          <!-- Botones -->
          <BaseButton
            label="Unirse a partida"
            action="joinGame"
            variant="primary"
            :loading="esperandoInicio"
            @click="triggerUnirseAPartida"
            class="w-100 my-2"
          />
          
          <BaseButton
            label="Cancelar"
            action="cancel"
            variant="danger"
            @click="handleCancel"
            class="w-100 mt-2"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import Swal from 'sweetalert2';
  import BaseButton from '../components/BaseButton.vue';
  import { readDocumentById, queryDocuments, createSubCollection, onSnapshotDocument, readSubcollection } from "../firebase/servicesFirebase.js"
  import Code from '../components/Code.vue';
  
  const router = useRouter();
  const codeComponent = ref(null);
  const esperandoInicio = ref(false);
  
  const handleUnirseAPartida = async (codigoClean) => {
    try {
      esperandoInicio.value = true;
      
      if (!codigoClean) {
        Swal.fire("Error", "Debes ingresar un código de partida.", "error");
        return;
      }
  
      const partidaSnap = await readDocumentById("partidas", codigoClean);
      
      if (!partidaSnap) {
        Swal.fire("Error", "El código de la partida no existe.", "error");
        return;
      }
  
      router.push({ name: 'game-board', params: { gameId: codigoClean } });
      
    } catch (error) {
      console.error("Error al unirse a la partida:", error);
      Swal.fire("Error", "Ocurrió un problema al unirse a la partida.", "error");
    } finally {
      esperandoInicio.value = false;
    }
  };
  
  const triggerUnirseAPartida = () => {
    if (codeComponent.value) {
      codeComponent.value.unirseAPartida();
    }
  };
  
  const handleCancel = () => {
    router.push('/Home');
  };
  </script>
  
  <style scoped>
  .card-join {
    width: 100%;
    max-width: 400px;
  }
  </style>