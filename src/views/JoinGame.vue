<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100">
    <div class="card card-join">
      <Logo alt="logo-uno" class="w-25 d-block mx-auto"/>
      <div class="p-4 shadow-sm rounded-3 bg-white">
        <template v-if="!joinedGame">
          <GameCode
            ref="codeComponent"
            :esperando-inicio="esperandoInicio"
            @unirse-a-partida="handleUnirseAPartida"
          />

          <BaseButton
            label="Unirse a partida"
            action="joinGame"
            variant="primary"
            :loading="esperandoInicio"
            @click="triggerUnirseAPartida"
            class="w-100 my-2"
          />
        </template>

        <GameLobby
          v-else
          :game-code="gameCode"
          :players="players"
          @leave-game="handleLeaveGame"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import BaseButton from '../components/BaseButton.vue';
import GameCode from '../components/Code.vue';
import Logo from '@/components/Logo.vue';
import GameLobby from '@/components/GameLobby.vue';
import {
  readDocumentById,
  onSnapshotDocument,
  onSnapshotSubcollectionWithFullData,
  querySingleDocument,
  deleteDocumentFromSubcollection,
  createSubCollection,
  readSubcollection,
  querySubcollectionDocuments
} from "../firebase/servicesFirebase.js";
import { AuthService } from "../firebase/auth.js";

const router = useRouter();
const codeComponent = ref(null);
const esperandoInicio = ref(false);
const joinedGame = ref(false);
const gameCode = ref('');
const players = ref([]);
const unsubscribeGame = ref(null);
const unsubscribePlayers = ref(null);
const currentUser = ref(null);
const currentPlayer = ref(null);
const gameStatus = ref(null);



const isPlayerInGame = computed(() => {
  if (!currentPlayer.value || !gameCode.value) return false;
  return players.value.some(p => p.player_id === currentPlayer.value.id);
});

// Inicialización del usuario
const initializeUser = async () => {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) return;

    currentUser.value = user;
    const playerSnap = await querySingleDocument("players", "user_id", user.uid);
    if (playerSnap) {
      currentPlayer.value = playerSnap;
    }
  } catch (error) {
    console.error("Error al inicializar usuario:", error);
  }
};

// Llamar a initializeUser al montar el componente
initializeUser();

const handleUnirseAPartida = async (codigoClean) => {
  try {
    if (!codigoClean) {
      Swal.fire("Error", "Debes ingresar un código de partida.", "error");
      return;
    }

    if (!currentUser.value) {
      Swal.fire("Error", "Debes iniciar sesión para unirte a una partida.", "error");
      return;
    }

    if (!currentPlayer.value) {
      Swal.fire("Error", "No tienes un perfil de jugador. Por favor, crea uno primero.", "error");
      return;
    }

    esperandoInicio.value = true;

    // Verificar si la partida existe y su estado
    const gameSnap = await readDocumentById("games", codigoClean);
    if (!gameSnap) {
      Swal.fire("Error", "El código de la partida no existe.", "error");
      return;
    }

    // Verificar si la partida ya está finalizada
    if (gameSnap.status === "finished") {
      Swal.fire("Partida finalizada", "La partida ha finalizado. No puedes unirte en este momento.", "warning");
      return;
    }

    // Verificar si la partida ya está en progreso
    if (gameSnap.status === "in_progress") {
      // Verificar si el jugador ya está en la partida
      const participantsSnap = await querySubcollectionDocuments(
        "games",
        codigoClean,
        "game_participants",
        "game_id",
        codigoClean
      );
      const existingPlayer = participantsSnap.find(p => p.player_id === currentPlayer.value.id);

      if (!existingPlayer) {
        Swal.fire("Partida en curso", "La partida ya ha comenzado. No puedes unirte en este momento.", "warning");
        return;
      } else {
        Swal.fire("Bienvenido de vuelta", "Ya estás registrado en esta partida.", "info");
        router.push({ name: 'game-board', params: { gameId: codigoClean } });
        return;
      }
    }

    // Verificar si la partida está llena (máximo 4 jugadores)
    if (participantsSnap.length >= 4) {
      Swal.fire("Sala llena", "La sala ha alcanzado su capacidad máxima de jugadores.", "error");
      return;
    }

    const nextPosition = participantsSnap.length + 1;

    // Crear el jugador en la partida
    await createSubCollection("games", codigoClean, "game_participants", {
      game_id: codigoClean,
      player_id: currentPlayer.value.id,
      is_host: false,
      player_position: nextPosition
    });

    Swal.fire({
      title: "Nuevo jugador en la sala",
      icon: "success",
      text: `¡Bienvenido a la sala ${codigoClean}! ${currentPlayer.value.nickname} se ha unido al juego.`,
    });

    setupRealTimeListeners(codigoClean);
    gameCode.value = codigoClean;
    joinedGame.value = true;

  } catch (error) {
    console.error("Error al unirse a la partida:", error);
    Swal.fire("Error", "Ocurrió un problema al unirse a la partida.", "error");
  } finally {
    esperandoInicio.value = false;
  }
};

const setupRealTimeListeners = (gameId) => {
  unsubscribeGame.value = onSnapshotDocument("games", gameId, (doc) => {
    if (doc) {
      gameStatus.value = doc.status;
      if (doc.status === "in_progress") {
        router.push({ name: 'game-board', params: { gameId } });
      }
    }
  });

  unsubscribePlayers.value = onSnapshotSubcollectionWithFullData(
    "games",
    gameId,
    "game_participants",
    (snapshot) => {
      players.value = snapshot;
    }
  );
};

const handleLeaveGame = async () => {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) return;

    //Obtener el perfil del jugador
    const playerSnap = await querySingleDocument("players", "user_id", user.uid);
    if (!playerSnap) return;
    console.log("playerSnap", playerSnap);
    //Buscar la participación del jugador en la partida actual
    const participantsSnap = await readSubcollection(
      "games",
      gameCode.value,
      "game_participants",
    );
    console.log("participantsSnap", participantsSnap);
    const playerParticipant = participantsSnap.find(
      p => p.player_id === playerSnap.id
    );
    console.log(playerParticipant);
    if (!playerParticipant) {
      console.error("No se encontró la participación del jugador");
      return;
    }

    Swal.fire({
      title: 'Saliendo de la partida...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    //Eliminar la participación del jugador
    await deleteDocumentFromSubcollection(
      "games",
      gameCode.value,
      "game_participants",
      playerParticipant.id
    );

    Swal.close();
  } catch (error) {
    console.error("Error al abandonar la partida:", error);
    Swal.fire(
      "Error",
      "No se pudo abandonar la partida correctamente",
      "error"
    );
  } finally {
    if (unsubscribeGame.value) unsubscribeGame.value();
    if (unsubscribePlayers.value) unsubscribePlayers.value();
    joinedGame.value = false;
    gameCode.value = '';
    players.value = [];
  }
};

const triggerUnirseAPartida = () => {
  if (codeComponent.value) {
    codeComponent.value.unirseAPartida();
  }
};

onUnmounted(() => {
  if (unsubscribeGame.value) unsubscribeGame.value();
  if (unsubscribePlayers.value) unsubscribePlayers.value();
});
</script>

<style scoped>
.card-join {
  width: 100%;
  max-width: 400px;
}
</style>
