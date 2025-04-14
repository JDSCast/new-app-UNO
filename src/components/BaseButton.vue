<template>
    <button
      :type="type"
      :class="['btn', `btn-${variant}`, sizeClass, customClass]"
      :disabled="disabled || loading"
      @click="$emit('click', action)" 
    >
      <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      <slot>{{ label }}</slot>
    </button>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    label: String,
    type: {
      type: String,
      default: 'button'
    },
    variant: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    customClass: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true
    }
  })
  
  const sizeClass = computed(() => {
    return props.size ? `btn-${props.size}` : ''
  })
  </script>
  