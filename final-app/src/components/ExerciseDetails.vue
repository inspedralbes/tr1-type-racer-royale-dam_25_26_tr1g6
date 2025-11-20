<template>
  <v-container class="py-6 py-md-10">
    <v-row justify="center" class="mb-8">
      <v-col cols="12" lg="10" xl="8">
        <div class="d-flex align-center">
          <v-btn icon flat @click="goBack" class="mr-4"><v-icon size="28">mdi-arrow-left-circle</v-icon></v-btn>
          <h1 class="text-h4 font-weight-bold text-primary">Explorar Ejercicios</h1>
          <v-spacer></v-spacer>
          <v-btn icon @click="toggleTheme"><v-icon>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon></v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row justify="center" class="mb-8">
      <v-col cols="12" lg="10" xl="8">
        <v-sheet rounded="xl" elevation="6" class="pa-4 pa-md-6 bg-surface">
          <v-row justify="center" align="center">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="search"
                label="Buscar ejercicio (ej: bench press, squat)"
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                clearable
                @click:clear="clearSearch"
                hide-details="auto"
                persistent-hint
                hint="La búsqueda puede tardar. Se recomiendan términos en inglés."
                class="mb-4 mb-md-0"
                @keyup.enter="searchExercises"
              />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-btn color="primary" block size="large" :loading="loading && loadingType === 'search'" @click="searchExercises" class="font-weight-bold">
                <v-icon left>mdi-magnify</v-icon>Buscar
              </v-btn>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-switch
                v-model="filterHasGif"
                label="Mostrar solo con GIF/Imagen"
                color="secondary"
                hide-details
                inset
              ></v-switch>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>
    
    <v-row justify="center">
      <v-col cols="12" lg="10" xl="8">
        <v-alert v-if="error" type="error" icon="mdi-alert-circle" variant="tonal" class="mb-6" closable @click:close="error = ''">
          <span class="font-weight-bold">{{ error }}</span>
        </v-alert>
      </v-col>
    </v-row>

    <v-row v-if="loading && (loadingType === 'initial' || loadingType === 'search')" justify="center">
      <v-col cols="12" class="text-center pa-10">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4 text-h6 text-medium-emphasis">{{ loadingMessage }}</p>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col v-for="exercise in filteredExercises" :key="exercise.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="exercise-card mx-auto my-3 d-flex flex-column" elevation="4" rounded="lg" style="height: 100%;">
          <div @click="showDetails(exercise)" style="cursor: pointer;">
            <v-img 
              :src="exercise.gifUrl || exercise.thumbnailUrl || defaultImageUrl"
              height="200px" cover class="card-image"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height bg-grey-darken-3">
                  <v-progress-circular v-if="exercise.thumbnailLoading" indeterminate color="primary" size="50"></v-progress-circular>
                  <v-icon v-else color="grey-darken-1" size="80">mdi-dumbbell</v-icon>
                </div>
              </template>
            </v-img>
            <v-card-title class="text-capitalize pt-4 pb-2 text-wrap font-weight-bold text-primary">{{ exercise.name }}</v-card-title>
            <v-card-text class="pt-0 pb-2">
              <v-chip size="small" color="secondary" class="mr-2 mb-2">{{ translateToSpanish(exercise.bodyPart) }}</v-chip>
              <v-chip size="small" color="primary" class="mb-2">{{ translateToSpanish(exercise.target) }}</v-chip>
            </v-card-text>
          </div>
          <v-spacer></v-spacer>
          <v-card-actions class="pa-4">
            <v-btn
              color="primary" block @click.stop="selectExercise(exercise)"
              rounded="lg" variant="flat"
            >
              <v-icon start>mdi-dumbbell</v-icon>
              Start Training
            </v-btn>
          </v-card-actions>
          <div v-if="!exercise.gifUrl" v-intersect="(isIntersecting) => handleIntersection(isIntersecting, exercise)"></div>
        </v-card>
      </v-col>
      <v-col v-if="!loading && filteredExercises.length === 0" cols="12">
        <v-alert type="info" icon="mdi-information" variant="tonal" class="text-center mx-auto my-8" max-width="600">
          {{ noResultsMessage || 'No se encontraron ejercicios con estos criterios.' }}
        </v-alert>
      </v-col>
    </v-row>

    <v-dialog v-model="detailsDialog" max-width="800" scrollable>
      <v-card v-if="selectedExercise" rounded="xl" class="bg-surface">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="text-h5 text-capitalize text-wrap font-weight-bold">{{ selectedExercise.name }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="detailsDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-tabs v-model="tab" color="secondary" align-tabs="center" grow>
          <v-tab value="instructions">Instrucciones (IA)</v-tab>
          <v-tab value="details">Detalles y Demo</v-tab>
        </v-tabs>
        <v-card-text class="pa-0">
          <v-window v-model="tab">
            <v-window-item value="instructions" class="pa-6">
              <h3 class="text-h6 font-weight-bold text-primary mb-4">Guía de Ejecución</h3>
              <div v-if="instructionsLoading" class="text-center pa-10"><v-progress-circular indeterminate color="primary" size="50"></v-progress-circular><p class="mt-3">Generando instrucciones...</p></div>
              <div v-else class="instructions-content" style="white-space: pre-wrap;" v-html="generatedInstructions"></div>
            </v-window-item>
            <v-window-item value="details" class="pa-6">
              <h3 class="text-h6 font-weight-bold text-primary mb-4">Demostración Visual</h3>
              <div v-if="youtubeLoading" class="text-center pa-10"><v-progress-circular indeterminate color="primary" size="50"></v-progress-circular><p class="mt-3">Buscando video...</p></div>
              <v-responsive v-else-if="youtubeVideoId" aspect-ratio="16/9" class="mb-6 rounded-lg elevation-2"><iframe width="100%" height="100%" :src="`https://www.youtube.com/embed/${youtubeVideoId}`" frameborder="0" allowfullscreen class="rounded-lg"></iframe></v-responsive>
              <v-img v-else-if="selectedExercise.gifUrl" :src="selectedExercise.gifUrl.replace('http://', 'https://')" class="mb-6 rounded-lg elevation-2" max-height="350" contain></v-img>
              <v-alert v-else type="warning" variant="tonal">No se encontró demo visual.</v-alert>
              <h3 class="text-h6 font-weight-bold text-primary my-4">Especificaciones</h3>
              <v-list class="bg-transparent">
                <v-list-item prepend-icon="mdi-arm-flex" :title="translateToSpanish(selectedExercise.bodyPart)" subtitle="Parte del Cuerpo"></v-list-item>
                <v-list-item prepend-icon="mdi-target" :title="translateToSpanish(selectedExercise.target)" subtitle="Músculo Objetivo"></v-list-item>
                <v-list-item prepend-icon="mdi-weight-lifter" :title="translateToSpanish(selectedExercise.equipment)" subtitle="Equipamiento"></v-list-item>
              </v-list>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-background"><v-spacer></v-spacer><v-btn color="secondary" variant="flat" @click="detailsDialog = false">Cerrar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showSelectionDialog" max-width="500px">
      <v-card class="bg-surface rounded-xl">
        <v-card-title class="text-h6 text-primary">Start Training Session</v-card-title>
        <v-card-text class="py-6">
          <p class="mb-4">Vas a entrenar: <strong class="text-secondary">{{ exerciseToTrain?.name }}</strong></p>
          <v-text-field v-model="trainingUserName" label="Your Name" variant="outlined" hide-details class="mb-4" color="primary"></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" @click="showSelectionDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="startNewSession" :disabled="!trainingUserName">Empezar Sesión</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineProps, defineModel, defineEmits } from 'vue';

const props = defineProps({ isDark: Boolean });
const isDark = defineModel('isDark');
const emit = defineEmits(['back', 'start-training']);

// Estado
const exercises = ref([]);
const search = ref('');
const loading = ref(true);
const loadingType = ref('initial');
const loadingMessage = ref('Cargando ejercicios...');
const error = ref('');
const noResultsMessage = ref('');
const filterHasGif = ref(false);

const detailsDialog = ref(false);
const selectedExercise = ref(null);
const showSelectionDialog = ref(false);
const exerciseToTrain = ref(null);
const trainingUserName = ref('');

const youtubeVideoId = ref(null);
const youtubeLoading = ref(false);
const instructionsLoading = ref(false);
const generatedInstructions = ref('');
const tab = ref('instructions');

// Claves de API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_KEY = import.meta.env.VITE_EXERCISEDB_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const API_HOST = 'exercisedb.p.rapidapi.com';
const API_URL_ALL = `https://exercisedb.p.rapidapi.com/exercises?limit=40`;
const API_URL_SEARCH = 'https://exercisedb.p.rapidapi.com/exercises/name/';
const defaultImageUrl = 'https://i.imgur.com/3032700.png';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const filteredExercises = computed(() => {
  if (filterHasGif.value) {
    return exercises.value.filter(ex => ex.gifUrl);
  }
  return exercises.value;
});

function goBack() { emit('back'); }
function toggleTheme() { isDark.value = !isDark.value; }
function clearSearch() { search.value = ''; fetchInitialExercises(); }

async function fetchWithHandling(url, options) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera unos minutos.');
      if (response.status === 403) throw new Error('Acceso prohibido. Verifica tu API Key.');
      throw new Error(`Error de red: ${response.statusText}`);
    }
    return response.json();
  } catch (err) {
    error.value = err.message;
    return null;
  }
}

async function fetchInitialExercises() {
  loading.value = true;
  loadingType.value = 'initial';
  error.value = '';
  noResultsMessage.value = '';
  const data = await fetchWithHandling(API_URL_ALL, {
    method: 'GET',
    headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
  });
  if (data) {
    exercises.value = data.map(ex => ({ ...ex, thumbnailUrl: null, thumbnailLoading: false }));
  } else {
    noResultsMessage.value = 'No se pudieron cargar los ejercicios.';
  }
  loading.value = false;
  loadingType.value = '';
}

async function searchExercises() {
  if (!search.value.trim()) return;
  loading.value = true;
  loadingType.value = 'search';
  error.value = '';
  noResultsMessage.value = '';
  const data = await fetchWithHandling(`${API_URL_SEARCH}${search.value.toLowerCase()}`, {
    method: 'GET',
    headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
  });
  if (data) {
    exercises.value = data.map(ex => ({ ...ex, thumbnailUrl: null, thumbnailLoading: false }));
    if (data.length === 0) noResultsMessage.value = `No se encontraron ejercicios para "${search.value}".`;
  }
  loading.value = false;
  loadingType.value = '';
}

async function findYoutubeVideo(exercise) {
  if (!YOUTUBE_API_KEY) return;
  youtubeVideoId.value = null;
  youtubeLoading.value = true;
  const CHANNEL_ID = 'UCfQgsKhHjSyRLOp9mnffqVg';

  try {
    const dateAfter = new Date(); dateAfter.setFullYear(dateAfter.getFullYear() - 7);
    const publishedAfter = dateAfter.toISOString();
    const dateBefore = new Date(); dateBefore.setFullYear(dateBefore.getFullYear() - 6);
    const publishedBefore = dateBefore.toISOString();
    const query = `${exercise.name} exercise`;
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&channelId=${CHANNEL_ID}&type=video&publishedAfter=${publishedAfter}&publishedBefore=${publishedBefore}&maxResults=1&key=${YOUTUBE_API_KEY}`;
    
    const youtubeResponse = await fetch(youtubeApiUrl);
    if (!youtubeResponse.ok) return;
    
    const youtubeData = await youtubeResponse.json();
    if (youtubeData.items && youtubeData.items.length > 0) {
      youtubeVideoId.value = youtubeData.items[0].id.videoId;
    } else {
      console.warn(`No se encontró un video para "${exercise.name}" en el canal y rango de fechas especificado.`);
    }
  } catch (err) {
    console.error("Error en la búsqueda de video de YouTube:", err);
  } finally {
    youtubeLoading.value = false;
  }
}

async function handleIntersection(isIntersecting, exercise) {
  if (isIntersecting && !exercise.gifUrl && !exercise.thumbnailUrl && !exercise.thumbnailLoading) {
    await fetchPexelsThumbnail(exercise);
  }
}

async function fetchPexelsThumbnail(exercise) {
  if (exercise.thumbnailLoading || !PEXELS_API_KEY) return;
  exercise.thumbnailLoading = true;
  try {
    const query = `${exercise.name} ${translateToSpanish(exercise.target)} gym`;
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { 'Authorization': PEXELS_API_KEY }
    });
    if (!response.ok) throw new Error('Error en la API de Pexels');
    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      exercise.thumbnailUrl = data.photos[0].src.large;
    }
  } catch (err) {
    console.error("Error al buscar miniatura en Pexels:", err);
  } finally {
    exercise.thumbnailLoading = false;
  }
}

async function showDetails(exercise) {
  selectedExercise.value = exercise;
  detailsDialog.value = true;
  tab.value = 'instructions';
  
  const geminiPromise = GEMINI_API_KEY ? generateGeminiInstructions(exercise) : Promise.resolve();
  const youtubePromise = findYoutubeVideo(exercise);

  await Promise.all([geminiPromise, youtubePromise]);
}

async function generateGeminiInstructions(exercise) {
  instructionsLoading.value = true;
  generatedInstructions.value = '';
  try {
    const prompt = `Eres un entrenador personal de élite en español. Genera instrucciones claras (máximo 150 palabras) para el ejercicio: "${exercise.name}". Estructura: Objetivo, Ejecución, y Consejos. Formatea la respuesta con HTML (<strong> para títulos y <br> para saltos de línea).`;
    const result = await genAI.generateContent(prompt);
    generatedInstructions.value = (await result.response).text();
  } catch (err) {
    console.error("Error al generar instrucciones con Gemini:", err);
    generatedInstructions.value = 'No se pudieron generar las instrucciones.';
  } finally {
    instructionsLoading.value = false;
  }
}

async function selectExercise(exercise) {
  exerciseToTrain.value = exercise;
  trainingUserName.value = '';
  await findYoutubeVideo(exercise); 
  showSelectionDialog.value = true;
}

function startNewSession() {
  if (!youtubeVideoId.value) {
    alert("Lo sentimos, no se encontró un video de referencia para este ejercicio y el análisis de forma no está disponible.");
    return;
  }
  emit('start-training', {
    exercise: exerciseToTrain.value,
    userName: trainingUserName.value,
    youtubeId: youtubeVideoId.value
  });
  showSelectionDialog.value = false;
}

function translateToSpanish(term) {
  if (!term) return 'No especificado';
  const translations = { 'back': 'espalda', 'cardio': 'cardio', 'chest': 'pecho', 'lower arms': 'antebrazos', 'lower legs': 'piernas (inferior)', 'neck': 'cuello', 'shoulders': 'hombros', 'upper arms': 'brazos (superior)', 'upper legs': 'piernas (superior)', 'waist': 'cintura', 'core': 'core', 'abductors': 'abductores', 'abs': 'abdominales', 'adductors': 'aductores', 'biceps': 'bíceps', 'calves': 'pantorrillas', 'cardiovascular system': 'cardiovascular', 'delts': 'deltoides', 'forearms': 'antebrazos', 'glutes': 'glúteos', 'hamstrings': 'isquiotibiales', 'lats': 'dorsales', 'pectorals': 'pectorales', 'quads': 'cuádriceps', 'spine': 'espina dorsal', 'traps': 'trapecios', 'triceps': 'tríceps', 'upper back': 'espalda alta', 'full body': 'cuerpo completo', 'assisted': 'asistido', 'band': 'banda elástica', 'barbell': 'barra', 'body weight': 'peso corporal', 'bosu ball': 'bosu', 'cable': 'cable', 'dumbbell': 'mancuerna', 'ez barbell': 'barra EZ', 'kettlebell': 'kettlebell', 'medicine ball': 'balón medicinal', 'olympic barbell': 'barra olímpica', 'resistance band': 'banda de resistencia', 'roller': 'rodillo', 'rope': 'cuerda', 'smith machine': 'máquina smith', 'stability ball': 'bola de estabilidad', 'tire': 'neumático', 'trap bar': 'barra hexagonal', 'weighted': 'con peso', 'wheel roller': 'rueda abdominal', 'leverage machine': 'máquina de palanca', 'plate': 'disco' };
  return translations[term.toLowerCase()] || term;
}

onMounted(() => {
  fetchInitialExercises();
});
</script>

<style scoped>
.exercise-card { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
.exercise-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4); }
.card-image { transition: transform 0.3s ease-in-out; }
.exercise-card:hover .card-image { transform: scale(1.05); }
.instructions-content { line-height: 1.6; }
</style>