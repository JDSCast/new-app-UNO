<script setup>
import AvatarUser from '../components/AvatarUser.vue'
import HandPlayer from '../components/HandPlayer.vue'
import HandOpponent from '../components/HandOpponent.vue'
import DeckOutCard from '../components/DeckOutCard.vue'
import DeckInCard from '../components/DeckInCard.vue'
import UnoButton from '../components/UnoButton.vue'
import ExitButton from '../components/ExitButton.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AuthService } from '../firebase/auth'
import {
  readDocumentById,
  onSnapshotDocument,
  onSnapshotSubcollectionWithFullData,
  onSnapshotSubcollection,
  querySingleDocument,
  readCollection
} from '../firebase/servicesFirebase'

const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId
const currentPlayerId = ref(null)
const gameState = ref(null)
const participants = ref([])
const currentCard = ref(null)
const allGameCards = ref([])
const playerCards = ref([])
const cardsCatalog = ref([])
const unsubscribers = []

// Función para ordenar participantes
const sortParticipants = (participantsData) => {
  if (!participantsData || !currentPlayerId.value) return participantsData

  // Encontrar el jugador actual
  const currentPlayerIndex = participantsData.findIndex(
    p => p.player_id === currentPlayerId.value
  )

  if (currentPlayerIndex === -1) return participantsData

  // Crear un nuevo array con el jugador actual primero
  const sortedParticipants = [
    participantsData[currentPlayerIndex],
    ...participantsData.slice(0, currentPlayerIndex),
    ...participantsData.slice(currentPlayerIndex + 1)
  ]

  // Ordenar los jugadores restantes por posición
  return sortedParticipants.sort((a, b) => {
    if (a.player_id === currentPlayerId.value) return -1
    if (b.player_id === currentPlayerId.value) return 1
    return a.player_position - b.player_position
  })
}

// Determinar el jugador actual
const determineCurrentPlayer = async () => {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      console.error('Usuario no autenticado')
      router.push('/login')
      return
    }

    // Buscar el jugador asociado al usuario actual
    const player = await querySingleDocument('players', 'user_id', user.uid)
    if (!player) {
      console.error('No se encontró el perfil del jugador')
      router.push('/register')
      return
    }

    currentPlayerId.value = player.id

    // Verificar si el jugador es parte de esta partida
    const isPlayerInGame = participants.value.some(
      participant => participant.player_id === currentPlayerId.value
    )

    // if (!isPlayerInGame) {
    //   console.error('El jugador no es parte de esta partida')
    //   router.push('/')
    //   return
    // }
  } catch (error) {
    console.error('Error al determinar el jugador actual:', error)
    router.push('/login')
  }
}

// Función para combinar la información de las cartas
const combineCardInfo = (cardInstances) => {
  return cardInstances.map(instance => {
    const cardInfo = cardsCatalog.value.find(card => card.id === instance.card_id)
    return {
      ...instance,
      ...cardInfo
    }
  })
}

// Inicializar el juego
const initializeGame = async () => {
  try {
    // Cargar el catálogo de cartas
    const cardsSnapshot = await readCollection('cards')
    cardsCatalog.value = cardsSnapshot

    const game = await readDocumentById('games', gameId)
    if (!game) {
      console.error('Juego no encontrado')
      router.push('/')
      return
    }
    gameState.value = game

    // Determinar el jugador actual antes de configurar las suscripciones
    await determineCurrentPlayer()

    // Suscribirse a cambios en el juego
    const gameUnsub = onSnapshotDocument('games', gameId, (game) => {
      gameState.value = game
    })
    unsubscribers.push(gameUnsub)

    // Suscribirse a participantes con información completa
    const participantsUnsub = onSnapshotSubcollectionWithFullData(
      'games',
      gameId,
      'game_participants',
      (participantsData) => {
        participants.value = sortParticipants(participantsData)
        // Verificar si el jugador actual sigue siendo parte del juego
        if (currentPlayerId.value) {
          const isPlayerInGame = participantsData.some(
            participant => participant.player_id === currentPlayerId.value
          )
          if (!isPlayerInGame) {
            console.error('El jugador ya no es parte de esta partida')
            router.push('/')
          }
        }
      }
    )
    unsubscribers.push(participantsUnsub)

    // Suscribirse a las cartas del juego
    const cardsUnsub = onSnapshotSubcollection(
      'games',
      gameId,
      'game_card_instances',
      (cards) => {
        // Actualizar todas las cartas del juego
        allGameCards.value = cards

        // Actualizar carta actual en el mazo de descarte
        const discardCard = cards.find(card => card.location === 'discard_pile')
        if (discardCard) {
          const discardCardInfo = cardsCatalog.value.find(card => card.id === discardCard.card_id)
          currentCard.value = {
            ...discardCard,
            ...discardCardInfo
          }
        }

        // Actualizar cartas del jugador actual
        if (currentPlayerId.value) {
          const playerCardInstances = cards.filter(
            card => card.current_owner_player_id === currentPlayerId.value &&
                   card.location === 'player_hand'
          )
          playerCards.value = combineCardInfo(playerCardInstances)
        }
      }
    )
    unsubscribers.push(cardsUnsub)

    // Suscribirse a los turnos del juego
    const turnsUnsub = onSnapshotSubcollection(
      'games',
      gameId,
      'gameplay_turns',
      (turns) => {
        const lastTurn = turns[turns.length - 1]
        if (lastTurn) {
          console.log('Último turno:', lastTurn)
        }
      }
    )
    unsubscribers.push(turnsUnsub)

  } catch (error) {
    console.error('Error al inicializar el juego:', error)
  }
}

const handleUnoCalled = () => {
  // Implementar la lógica para llamar UNO
  console.log('¡UNO! fue llamado')
}

const handleExitGame = () => {
  router.push('/')
}

const handleCardPlayed = (cardData) => {
  // Implementar la lógica para jugar una carta
  console.log('Carta jugada:', cardData)
}

// Computed properties y métodos para obtener datos dinámicos
const getPlayerCardCount = (playerId) => {
  if (!playerId) return 0
  return allGameCards.value.filter(card =>
    card.current_owner_player_id === playerId &&
    card.location === 'player_hand'
  ).length
}

const getPlayerScore = (playerId) => {
  if (!playerId) return 0
  // TODO: Implementar lógica para calcular puntuación basada en las cartas jugadas
  return 0
}

onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  // Limpiar suscripciones
  unsubscribers.forEach(unsub => unsub())
})
</script>

<template>
  <main class="game-container">
    <div class="exit-button-container">
      <ExitButton @exit-game="handleExitGame" />
    </div>
    <div class="game-layout">
      <!-- Oponentes -->
      <div v-if="participants.length > 0" class="opponent-section top">
        <div class="row align-items-center justify-content-center">
          <div class="col-2">
            <DeckInCard />
          </div>
          <div class="col-2">
            <AvatarUser
              :name="participants[1]?.nickname || 'Oponente 1'"
              :avatarUrl="participants[1]?.avatar_url"
              :score="getPlayerScore(participants[1]?.player_id)"
              :isTurn="gameState?.current_turn_player_id === participants[1]?.player_id"
            />
          </div>
          <div class="col-6">
            <HandOpponent :cardCount="getPlayerCardCount(participants[1]?.player_id)" />
          </div>
        </div>
      </div>

      <div class="middle-section">
        <!-- Oponente izquierdo -->
        <div v-if="participants[2]" class="opponent-section left">
          <div class="row align-items-center">
            <div class="col-12">
              <div class="d-flex flex-column align-items-center">
                <AvatarUser
                  :name="participants[2]?.nickname || 'Oponente 2'"
                  :avatarUrl="participants[2]?.avatar_url"
                  :score="getPlayerScore(participants[2]?.player_id)"
                  :isTurn="gameState?.current_turn_player_id === participants[2]?.player_id"
                />
                <HandOpponent
                  :isVertical="true"
                  rotateDirection="left"
                  :cardCount="getPlayerCardCount(participants[2]?.player_id)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tablero central -->
        <div class="game-board">
          <div class="deck-placeholder">
            <DeckOutCard
              v-if="currentCard"
              :number="currentCard.number"
              :color="currentCard.color"
            />
          </div>
        </div>

        <!-- Oponente derecho -->
        <div v-if="participants.length > 2" class="opponent-section right">
          <div class="row align-items-center">
            <div class="col-12">
              <div class="d-flex flex-column align-items-center">
                <AvatarUser
                  :name="participants[3]?.nickname || 'Oponente 3'"
                  :avatarUrl="participants[3]?.avatar_url"
                  :score="getPlayerScore(participants[3]?.player_id)"
                  :isTurn="gameState?.current_turn_player_id === participants[3]?.player_id"
                />
                <HandOpponent
                  :isVertical="true"
                  rotateDirection="right"
                  :cardCount="getPlayerCardCount(participants[3]?.player_id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Jugador actual -->
      <div class="player-section">
        <div class="row align-items-center">
          <div class="col-2">
            <AvatarUser
              :name="participants[0]?.nickname || 'Jugador'"
              :avatarUrl="participants[0]?.avatar_url"
              :score="getPlayerScore(participants[0]?.player_id)"
              :isTurn="gameState?.current_turn_player_id === currentPlayerId"
            />
          </div>
          <div class="col-8">
            <HandPlayer
              :cards="playerCards"
              @card-played="handleCardPlayed"
            />
          </div>
          <div class="col-2">
            <UnoButton
              @uno-called="handleUnoCalled"
              :disabled="playerCards.length !== 1"
            />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.game-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}

.exit-button-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.game-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 2rem;
}

.middle-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 2rem;
}

.opponent-section {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.opponent-section.left,
.opponent-section.right {
  width: 200px;
  height: 100%;
  min-height: 400px;
}

.opponent-section.left .hand-opponent,
.opponent-section.right .hand-opponent {
  transform: rotate(90deg);
}

.game-board {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: 2rem;
}

.player-section {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.deck-placeholder {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
}

.current-card {
  position: relative;
  z-index: 2;
}

.card-uno {
  width: 120px;
  height: 180px;
  border-radius: 10px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
}

.card-uno:hover {
  transform: scale(1.05);
}

.opponent-section.top {
  position: relative;
}

.deck-in-card {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
}
</style>
