<template>
    <div class="game-lobby">
      <h2 class="text-center mb-3">Sala: {{ gameCode }}</h2>
      <p class="text-center mb-4 text-muted">
        <span class="spinner-border spinner-border-sm" role="status"></span>
        Esperando que el host inicie la partida...
      </p>
  
      <div class="players-list">
        <h4 class="text-center mb-3">Jugadores conectados ({{ players.length }})</h4>
        <div class="list-group">
          <div 
            v-for="(player, index) in players" 
            :key="index" 
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <span v-if="player.host" class="badge bg-primary me-2">Host</span>
              {{ player.nombre || `Jugador ${index + 1}` }}
            </div>
            <span class="badge bg-success">Conectado</span>
          </div>
        </div>
      </div>
  
      <BaseButton
        label="Abandonar sala"
        variant="outline-danger"
        @click="handleLeave"
        class="w-100 mt-4"
      />
    </div>
  </template>
  
  <script>
  import { defineComponent } from 'vue';
  import BaseButton from './BaseButton.vue';
  
  export default defineComponent({
    name: 'GameLobby',
    components: {
      BaseButton
    },
    props: {
      gameCode: {
        type: String,
        required: true
      },
      players: {
        type: Array,
        required: true,
        default: () => []
      }
    },
    emits: ['leave-game'],
    methods: {
      handleLeave() {
        this.$emit('leave-game');
      }
    }
  });
  </script>
  
  <style scoped>
  .game-lobby {
    min-width: 300px;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .players-list {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 1.5rem;
    border: 1px solid #eee;
    border-radius: 0.5rem;
  }
  
  .list-group-item {
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  
  .spinner-border {
    margin-right: 0.5rem;
  }
  </style>