<script setup>
import { ref } from 'vue'
import CardEffectModal from './CardEffectModal.vue'

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ['number', 'skip', 'reverse', 'draw_two', 'wild', 'wild_draw_four'].includes(value)
  },
  number: {
    type: Number,
    default: null
  },
  color: {
    type: String,
    default: 'red',
    validator: (value) => ['red', 'green', 'blue', 'yellow', 'wild'].includes(value)
  }
})

const emit = defineEmits(['card-played'])

const showModal = ref(false)

const handleCardClick = () => {
  if (props.type === 'wild' || props.type === 'wild_draw_four') {
    showModal.value = true
  } else {
    emit('card-played', { type: props.type, number: props.number, color: props.color })
  }
}

const handleColorSelect = (selectedColor) => {
  emit('card-played', { type: props.type, number: props.number, color: selectedColor })
}

const handleCloseModal = () => {
  showModal.value = false
}

const getCardIcon = () => {
  switch (props.type) {
    case 'reverse':
      return 'bi-arrow-left-right'
    case 'skip':
      return 'bi-slash-circle'
    case 'draw_two':
      return 'bi-plus'
    case 'wild':
    case 'wild_draw_four':
      return 'bi-asterisk'
    default:
      return ''
  }
}

const isSpecialCard = () => {
  return props.type !== 'number'
}
</script>

<template>
  <div class="card-uno" :class="color" @click="handleCardClick">
    <div class="card-content">
      <div class="card-corner top-left">
        <span v-if="type === 'number'" class="number">{{ number }}</span>
        <div v-else class="special-number">
          <i
            v-if="type === 'reverse' || type === 'skip' || type === 'wild' || type === 'wild_draw_four'"
            :class="['bi', getCardIcon(), 'icon']"
          ></i>
          <template v-else-if="type === 'draw_two'">
            <i class="bi bi-plus icon"></i>
            <span class="number">2</span>
          </template>
        </div>
      </div>
      <div class="card-center">
        <span v-if="type === 'number'" class="number center-content">{{ number }}</span>
        <div v-else class="special-number center-content">
          <i
            v-if="type === 'reverse' || type === 'skip' || type === 'wild' || type === 'wild_draw_four'"
            :class="['bi', getCardIcon(), 'icon']"
          ></i>
          <template v-else-if="type === 'draw_two'">
            <i class="bi bi-plus icon"></i>
            <span class="number">2</span>
          </template>
        </div>
      </div>
      <div class="card-corner bottom-right">
        <span v-if="type === 'number'" class="number">{{ number }}</span>
        <div v-else class="special-number">
          <i
            v-if="type === 'reverse' || type === 'skip' || type === 'wild' || type === 'wild_draw_four'"
            :class="['bi', getCardIcon(), 'icon']"
          ></i>
          <template v-else-if="type === 'draw_two'">
            <i class="bi bi-plus icon"></i>
            <span class="number">2</span>
          </template>
        </div>
      </div>
    </div>
  </div>

  <CardEffectModal
    :show="showModal"
    :card-type="type"
    :color="color"
    @close="handleCloseModal"
    @select-color="handleColorSelect"
  />
</template>

<style scoped>
.card-uno {
  width: 120px;
  height: 180px;
  border-radius: 10px;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.2s;
}

@media (max-width: 768px) {
  .card-uno {
    width: 80px;
    height: 120px;
  }

  .number {
    font-size: 1.5em;
  }

  .card-corner {
    width: 20px;
    height: 20px;
  }
}

.card-uno:hover {
  transform: scale(1.05);
}

.card-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  box-sizing: border-box;
}

.card-corner {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-left {
  align-self: flex-start;
}

.bottom-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.card-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-radius: 50%;
  margin: 10px;
}

.center-content {
  color: currentColor;
}

.number {
  font-size: 2em;
  font-weight: bold;
  color: white;
}

.icon {
  font-size: 2.5em;
  color: white;
}

.red {
  background-color: #ff4444;
}

.blue {
  background-color: #4444ff;
}

.green {
  background-color: #44ff44;
}

.yellow {
  background-color: #ffff44;
}

.black {
  background-color: #000000;
}

.red .center-content {
  color: #ff4444;
}

.blue .center-content {
  color: #4444ff;
}

.green .center-content {
  color: #44ff44;
}

.yellow .center-content {
  color: #ffff44;
}

.black .center-content {
  color: #000000;
}

.special-number {
  display: flex;
  align-items: center;
  gap: 2px;
}

.special-number .icon {
  font-size: 1.5em;
}

.special-number .number {
  font-size: 1.5em;
}

.special-number.center-content {
  gap: 5px;
}

.special-number.center-content .icon {
  font-size: 2em;
}

.special-number.center-content .number {
  font-size: 2em;
}
</style>
