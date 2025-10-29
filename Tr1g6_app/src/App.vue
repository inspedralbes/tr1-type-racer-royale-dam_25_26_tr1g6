<!-- src/App.vue -->
<template>
  <v-app>
    <v-app-bar color="red-darken-3" dark flat>
      <v-toolbar-title>Mi App de Fitness</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <!-- Aquí es donde usamos nuestro nuevo componente -->
       <HelloWorld />
      <Buscadordeejercicios />
    </v-main>
  </v-app>
</template>

<script setup>
// Importamos el componente que acabamos de crear
import Buscadordeejercicios from './components/Buscadordeejercicios.vue';
import HelloWorld from './components/HelloWorld.vue';
</script>