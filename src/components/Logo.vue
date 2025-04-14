<!-- src/components/Logo.vue -->
<template>
    <img
      :src="src"
      :alt="alt"
      :class="['img-fluid', imgClass]"
      :style="styleObject"
    />
  </template>
  
  <script setup>
  const props = defineProps({
    src: {
      type: String,
      default: '/src/assets/logo.png', // Ruta por defecto del logo
    },
    alt: {
      type: String,
      default: 'Logo',
    },
    width: {
      type: [String, Number],
      default: 100,
    },
    height: {
      type: [String, Number],
      default: 100,
    },
    imgClass: {
      type: String,
      default: '',
    },
  });
  
  const styleObject = {
    width: `${props.width}px`,
    height: `${props.height}px`,
    objectFit: 'contain',
  };
  </script>
  