<template>
  <v-app>
    <v-app-bar color="red-darken-3" dark flat>
      <v-toolbar-title>Buscador de Ejercicios PRO</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="py-10">
        <!-- SECCIÓN DE BÚSQUEDA Y FILTROS -->
        <v-row justify="center" align="center" class="mb-8">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="Buscar ejercicio por nombre"
              prepend-inner-icon="mdi-magnify"
              color="red-darken-3"
              outlined
              clearable
              hide-details
              hint="La búsqueda debe ser en inglés (ej: bench press, squat)"
              @keyup.enter="searchExercises"
            />
          </v-col>
          <v-col cols="12" md="2">
              <v-btn color="primary" block x-large :loading="loading" @click="searchExercises">Buscar</v-btn>
          </v-col>
          <v-col cols="12" md="3">
            <v-switch
              v-model="filterHasGif"
              label="Mostrar solo con GIF"
              color="red-darken-3"
              hide-details
            ></v-switch>
          </v-col>
        </v-row>
        
        <!-- Alertas y Carga -->
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <div v-if="loading" class="text-center">
              <v-progress-circular indeterminate color="red-darken-3"></v-progress-circular>
              <p class="mt-2">{{ loadingMessage }}</p>
            </div>
          </v-col>
        </v-row>

        <!-- GALERÍA DE EJERCICIOS -->
        <v-row v-if="!loading">
          <v-col v-for="exercise in filteredExercises" :key="exercise.id" cols="12" sm="6" md="4" lg="3">
            <v-card class="mx-auto my-4" max-width="400" min-height="250" elevation="4">
              <template v-if="exercise.gifUrl">
                <v-img 
                  :src="exercise.gifUrl.replace('http://', 'https://')" 
                  height="100%"
                  cover
                  class="align-end text-white"
                  gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.7)"
                >
                  <div class="fill-height d-flex flex-column">
                    <div>
                      <v-card-title class="text-capitalize pt-4">{{ exercise.name }}</v-card-title>
                      <v-card-subtitle class="text-capitalize">Músculo: <strong>{{ translateToSpanish(exercise.target) }}</strong></v-card-subtitle>
                    </div>
                    <v-spacer></v-spacer>
                    <v-card-actions>
                      <v-btn color="white" text @click="showDetails(exercise)">Detalles</v-btn>
                    </v-card-actions>
                  </div>
                </v-img>
              </template>
              <template v-else>
                <div class="d-flex flex-column fill-height">
                    <div>
                        <v-card-title class="text-capitalize pt-4">{{ exercise.name }}</v-card-title>
                        <v-card-subtitle class="text-capitalize">Músculo: <strong>{{ translateToSpanish(exercise.target) }}</strong></v-card-subtitle>
                    </div>
                    <v-spacer></v-spacer>
                    <v-card-actions>
                        <v-btn color="red-darken-3" text @click="showDetails(exercise)">Detalles</v-btn>
                    </v-card-actions>
                </div>
              </template>
            </v-card>
          </v-col>
           <v-col v-if="!loading && filteredExercises.length === 0" cols="12">
            <v-alert type="info" class="text-center">
                {{ noResultsMessage }}
            </v-alert>
          </v-col>
        </v-row>

        <!-- DIÁLOGO DE DETALLES DEL EJERCICIO -->
        <v-dialog v-model="detailsDialog" max-width="600">
          <v-card v-if="selectedExercise">
            <v-card-title class="text-h5 text-capitalize">{{ selectedExercise.name }}</v-card-title>
            <v-card-subtitle class="text-capitalize">
              Parte del cuerpo: {{ translateToSpanish(selectedExercise.bodyPart) }}
            </v-card-subtitle>
            
            <v-card-text class="pt-4">
              <strong class="text-capitalize">Músculo objetivo:</strong> {{ translateToSpanish(selectedExercise.target) }} <br>
              <strong class="text-capitalize">Equipamiento:</strong> {{ translateToSpanish(selectedExercise.equipment) }}
              
              <v-divider class="my-4"></v-divider>

              <strong>Instrucciones:</strong>
              <p class="mt-2">Observa el GIF para la correcta ejecución del movimiento.</p>
              <v-img v-if="selectedExercise.gifUrl" :src="selectedExercise.gifUrl.replace('http://', 'https://')" class="mt-2 border"></v-img>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="detailsDialog = false">Cerrar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// --- ESTADO ---
const search = ref('');
const exercises = ref([]);
const selectedExercise = ref(null);
const loading = ref(true);
const error = ref('');
const detailsDialog = ref(false);
const noResultsMessage = ref('');
const loadingMessage = ref('');
const filterHasGif = ref(false);

// --- Propiedad computada para filtrar ---
const filteredExercises = computed(() => {
  if (!filterHasGif.value) {
    return exercises.value;
  }
  return exercises.value.filter(exercise => exercise.gifUrl);
});

// --- CONSTANTES ---
const API_KEY = '63e7cf7012msh5e3ce60374b5b8ap1a0ac6jsne3d3901068fb';
const API_HOST = 'exercisedb.p.rapidapi.com';
const API_URL_SEARCH = 'https://exercisedb.p.rapidapi.com/exercises/name/';
const API_URL_ALL = 'https://exercisedb.p.rapidapi.com/exercises';

// --- LÓGICA ---
onMounted(() => {
  fetchInitialExercises();
});

async function fetchInitialExercises() {
  loading.value = true;
  loadingMessage.value = 'Cargando ejercicios aleatorios...';
  error.value = '';
  try {
    const response = await fetch(API_URL_ALL, {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
    });
    if (!response.ok) throw new Error('Error al cargar la lista inicial de ejercicios.');
    const data = await response.json();
    exercises.value = shuffleArray(data).slice(0, 12);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function searchExercises() {
  if (!search.value) return;
  
  loading.value = true;
  loadingMessage.value = 'Buscando ejercicios...';
  error.value = '';
  try {
    const response = await fetch(`${API_URL_SEARCH}${search.value.toLowerCase()}`, {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
    });
    if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}.`);
    
    const data = await response.json();
    exercises.value = data;
    
    if (data.length === 0) {
      noResultsMessage.value = `No se encontraron ejercicios para "${search.value}".`;
    }
  } catch (err) {
    error.value = `Ocurrió un error: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

// --- FUNCIONES AUXILIARES ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function showDetails(exercise) {
  selectedExercise.value = exercise;
  detailsDialog.value = true;
}

function translateToSpanish(term) {
  if (!term) return 'No especificado';
  
  const translations = {
    // Body Parts
    'back': 'espalda', 'cardio': 'cardio', 'chest': 'pecho', 'lower arms': 'antebrazos',
    'lower legs': 'piernas (inferior)', 'neck': 'cuello', 'shoulders': 'hombros', 'upper arms': 'brazos (superior)',
    'upper legs': 'piernas (superior)', 'waist': 'cintura', 'core': 'core',
    // Target Muscles
    'abductors': 'abductores', 'abs': 'abdominales', 'adductors': 'aductores',
    'biceps': 'bíceps', 'calves': 'pantorrillas', 'cardiovascular system': 'sistema cardiovascular',
    'delts': 'deltoides', 'forearms': 'antebrazos', 'glutes': 'glúteos',
    'hamstrings': 'isquiotibiales', 'lats': 'dorsales', 'pectorals': 'pectorales',
    'quads': 'cuádriceps', 'spine': 'espina dorsal', 'traps': 'trapecios',
    'triceps': 'tríceps', 'upper back': 'espalda alta',
    // Equipment
    'assisted': 'asistido', 'band': 'banda elástica', 'barbell': 'barra',
    'body weight': 'peso corporal', 'bosu ball': 'bosu', 'cable': 'cable',
    'dumbbell': 'mancuerna', 'ez barbell': 'barra EZ', 'kettlebell': 'kettlebell (pesa rusa)',
    'medicine ball': 'balón medicinal', 'olympic barbell': 'barra olímpica', 'resistance band': 'banda de resistencia',
    'roller': 'rodillo', 'rope': 'cuerda', 'smith machine': 'máquina smith',
    'stability ball': 'bola de estabilidad', 'tire': 'neumático', 'trap bar': 'barra hexagonal',
    'weighted': 'con peso', 'wheel roller': 'rueda abdominal', 'leverage machine': 'máquina de palanca'
  };

  return translations[term.toLowerCase()] || term;
}
</script>

<style>
.text-capitalize {
  text-transform: capitalize;
}
</style>