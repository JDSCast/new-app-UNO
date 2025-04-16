<template>
    <div class="players-list">
      <h4 class="text-center mb-4">Lista de participantes</h4>
      <div class="list-group mb-4">
        <div
          v-for="(player, index) in players"
          :key="index"
          class="list-group-item"
        >
          {{ player.nickname }}
          <span v-if="player.is_host" class="badge bg-info ms-2">Host</span>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  defineProps({
    players: {
      type: Array,
      required: true,
      default: () => []
    }
  });
  </script>