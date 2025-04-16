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
  import { ref, onMounted, onUnmounted } from "vue";
  import { useRouter } from "vue-router";
  import { AuthService } from "../firebase/auth.js";
  import {
    createDocument,
    readDocumentById,
    updateDocument,
    createSubCollection,
    onSnapshotDocument,
    onSnapshotSubcollectionWithFullData,
    querySingleDocument,
    readCollection,
    createSubcollectionBatch
  } from "../firebase/servicesFirebase.js";
  import Swal from "sweetalert2";
  import GameCode from "@/components/GameCode.vue";
  import PlayersList from "@/components/PlayersList.vue";
  import GameControls from "@/components/GameControls.vue";

  const router = useRouter();
  const gameCode = ref("");
  const players = ref([]);
  const gameStatus = ref("esperando");
  const unsubscribers = ref([]);

  // Generador de código
  const generateGameCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Lógica para crear la partida
  const createGame = async () => {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      Swal.fire("Error", "Debes iniciar sesión para crear una partida.", "error");
      return router.push("/login");
    }

    const playerActual = await querySingleDocument("players", "user_id", user.uid);
    if (!playerActual) {
      Swal.fire("Error", "Debes registrar un jugador para crear una partida.", "error");
      return router.push("/register");
    }

    let newCode;
    let gameSnapshot;

    try {
      do {
        newCode = generateGameCode();
        gameSnapshot = await readDocumentById("games", newCode);
      } while (gameSnapshot);

      await createDocument("games", {
        status: "waiting",
        created_at: new Date().toISOString(),
        current_turn_player_id: playerActual.id,
      }, newCode);

      await createSubCollection(
        "games",
        newCode,
        "game_participants",
        {
          game_id: newCode,
          player_id: playerActual.id,
          is_host: true,
          player_position: 1,
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
  // Listeners para cambios en tiempo real
  const setupGameListeners = (code) => {
    const playersUnsub = onSnapshotSubcollectionWithFullData(
      "games",
      code,
      "game_participants",
      (snapshot) => {
        players.value = snapshot;
      }
    );
    unsubscribers.value.push(playersUnsub);

    const gameUnsub = onSnapshotDocument("games", code, (doc) => {
      if (doc?.status === "in_progress") {
        router.push(`/game-board/${code}`);
      }
    });
    unsubscribers.value.push(gameUnsub);
  };

  // Limpiar listeners al desmontar el componente
  onUnmounted(() => {
    unsubscribers.value.forEach(unsub => unsub());
    unsubscribers.value = [];
  });

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
        await updateDocument("games", gameCode.value, { status: "in_progress" });

        Swal.fire("¡Partida iniciada!", "¡Que comience el juego!", "success");
      } else if (players.value.length < 2) {
        Swal.fire("Error", "Necesitas al menos 2 jugadores para iniciar la partida.", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire("Error", "No se pudo iniciar la partida.", "error");
    }
  };

  // Lógica para asignar cartas
  const assignCardsToPlayers = async () => {
    try {
      // Obtener todas las cartas del catálogo
      const cardsSnapshot = await readCollection("cards");
      if (!cardsSnapshot || cardsSnapshot.length === 0) {
        throw new Error("No hay cartas disponibles en el catálogo.");
      }

      // Crear un array con todas las cartas disponibles
      let availableCards = [...cardsSnapshot];
      let allCardInstances = [];

      // Asignar 7 cartas a cada jugador
      for (const player of players.value) {
        let playerCardOrder = 0; // Reiniciar el orden para cada jugador
        for (let i = 0; i < 7; i++) {
          // Seleccionar una carta aleatoria
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          const selectedCard = availableCards[randomIndex];

          // Agregar la instancia de carta al array
          allCardInstances.push({
            game_id: gameCode.value,
            card_id: selectedCard.id,
            location: "player_hand",
            current_owner_player_id: player.player_id,
            card_order: playerCardOrder++
          });

          // Eliminar la carta asignada del conjunto disponible
          availableCards.splice(randomIndex, 1);
        }
      }

      // Colocar la primera carta en el mazo de descarte
      if (availableCards.length > 0) {
        const firstCardIndex = Math.floor(Math.random() * availableCards.length);
        const firstCard = availableCards[firstCardIndex];

        allCardInstances.push({
          game_id: gameCode.value,
          card_id: firstCard.id,
          location: "discard_pile",
          card_order: 0 // Solo hay una carta en la pila de descarte inicialmente
        });

        availableCards.splice(firstCardIndex, 1);
      }

      // El resto de las cartas van al mazo
      let deckCardOrder = 0; // Orden específico para el mazo
      while (availableCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const selectedCard = availableCards.splice(randomIndex, 1)[0];

        allCardInstances.push({
          game_id: gameCode.value,
          card_id: selectedCard.id,
          location: "deck",
          card_order: deckCardOrder++
        });
      }

      // Crear todas las instancias de cartas en un solo lote
      await createSubcollectionBatch("games", gameCode.value, "game_card_instances", allCardInstances);

    } catch (error) {
      console.error("Error al asignar cartas:", error);
      throw error;
    }
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