<template>
    <div class="container-creategame">
      <div class="card-creategame p-4">
        <GameCode :code="gameCode" :status="gameStatus" />
        
        <PlayersList :players="players" />
        
        <GameControls 
          :players="players" 
          @start-game="initiateGame"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from "vue";
  import { useRouter } from "vue-router";
  import { AuthService } from "../firebase/auth.js";
  import {
    createDocument,
    readDocumentById,
    updateDocument,
    createSubCollection,
    onSnapshotDocument,
    onSnapshotSubcollectionWithFullData
  } from "../firebase/servicesFirebase.js";
  import Swal from "sweetalert2";
  import GameCode from "@/components/GameCode.vue";
  import PlayersList from "@/components/PlayersList.vue";
  import GameControls from "@/components/GameControls.vue";
  
  const router = useRouter();
  const gameCode = ref("");
  const players = ref([]);
  const gameStatus = ref("esperando");
  
  // Generador de código (mismo que tu implementación)
  const generateGameCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };
  
  // Lógica para crear la partida (similar a tu implementación)
  const createGame = async () => {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      Swal.fire("Error", "Debes iniciar sesión para crear una partida.", "error");
      return router.push("/login");
    }
  
    let newCode;
    let gameSnapshot;
  
    try {
      do {
        newCode = generateGameCode();
        gameSnapshot = await readDocumentById("partidas", newCode);
      } while (gameSnapshot);
  
      await createDocument("partidas", {
        codigo: newCode,
        estado: "esperando",
        turnoActual: user.uid,
        cartaActual: null,
        colorActual: null,
        cartaAcumulada: null,
      }, newCode);
  
      await createSubCollection(
        "partidas",
        newCode,
        "jugadores_partida",
        {
          idJugador: user.uid,
          idPartida: newCode,
          host: true,
          estadoUno: false,
        }
      );
  
      gameCode.value = newCode;
  
      // Listeners para cambios en tiempo real
      setupGameListeners(newCode);
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "No se pudo crear la partida.", "error");
    }
  };
  
  const setupGameListeners = (code) => {
    onSnapshotSubcollectionWithFullData(
      "partidas",
      code,
      "jugadores_partida",
      (snapshot) => {
        players.value = snapshot;
      }
    );
  
    onSnapshotDocument("partidas", code, (doc) => {
      if (doc?.estado === "iniciada") {
        router.push(`/game-board/${code}`);
      }
    });
  };
  
  // Lógica para iniciar partida
  const initiateGame = async () => {
    try {
      const confirmation = await Swal.fire({
        title: "¿Iniciar partida?",
        text: "Una vez iniciada, no podrás agregar más jugadores.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, iniciar",
        cancelButtonText: "Cancelar",
      });
  
      if (confirmation.isConfirmed && players.value.length >= 2) {
        Swal.fire({
          title: "Iniciando partida...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });
  
        await assignCardsToPlayers();
        await updateDocument("partidas", gameCode.value, { estado: "iniciada" });
        
        Swal.fire("¡Partida iniciada!", "", "success");
      } else if (players.value.length < 2) {
        Swal.fire("Error", "Necesitas al menos 2 jugadores.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "No se pudo iniciar la partida.", "error");
    }
  };
  
  // Lógica para asignar cartas (similar a tu implementación)
  const assignCardsToPlayers = async () => {
    // Tu implementación actual de asignarCartasAJugadores
  };
  
  onMounted(createGame);
  </script>
  
  <style scoped>
  .container-creategame {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  
  .card-creategame {
    width: 100%;
    max-width: 500px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  </style>