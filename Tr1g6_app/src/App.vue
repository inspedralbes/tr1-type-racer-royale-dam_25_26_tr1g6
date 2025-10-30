<template>
  <v-app>
    <!-- APP BAR -->
    <v-app-bar color="red-darken-3" dark flat elevate-on-scroll>
      <v-toolbar-title>
        <v-icon left>mdi-dumbbell</v-icon>
        Virtual Trainer — Real Time
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text @click="openDocs">Docs</v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="py-8">
        <!-- HERO / SEARCH -->
        <v-card class="pa-6 mb-8" elevation="3">
          <v-row align="center">
            <v-col cols="12" md="7">
              <h1>Entrena con compañía en tiempo real</h1>
              <p class="small-muted">
                Conecta tu webcam, comparte la sesión con otros y recibe retroalimentación en tiempo real sobre tus ejercicios.
              </p>
              <v-row class="mt-4">
                <v-col cols="12" sm="7">
                  <v-text-field
                    v-model="search"
                    label="Buscar ejercicio (inglés)"
                    placeholder="bench press, squat..."
                    hide-details
                    :append-inner-icon="loading ? 'mdi-loading' : 'mdi-magnify'"
                    @keyup.enter="searchExercises"
                  />
                </v-col>
                <v-col cols="12" sm="5">
                  <v-btn block color="red-darken-3" :loading="loading" @click="searchExercises">
                    Buscar
                  </v-btn>
                </v-col>
              </v-row>
              <v-switch v-model="filterHasGif" label="Solo con GIF" class="mt-2" hide-details></v-switch>
            </v-col>
            <v-col cols="12" md="5">
              <v-img :src="heroIllustration" contain max-width="300"></v-img>
            </v-col>
          </v-row>
        </v-card>

        <!-- EXERCISES GRID -->
        <v-row>
          <v-col v-if="loading" cols="12">
            <v-skeleton-loader type="card@6"></v-skeleton-loader>
          </v-col>

          <v-col v-if="!loading && filteredExercises.length===0" cols="12">
            <v-alert type="info">{{ noResultsMessage || 'Intenta otra búsqueda o carga aleatorios.' }}</v-alert>
          </v-col>

          <v-col v-for="exercise in filteredExercises" :key="exercise.id" cols="12" sm="6" md="4" lg="3">
            <v-card class="card-hover" elevation="2">
              <v-img
                v-if="exercise.gifUrl"
                :src="exercise.gifUrl.replace('http://','https://')"
                height="180px"
                cover
                @error="onImageError($event, exercise)"
              >
                <template #default>
                  <div class="fill-height d-flex flex-column justify-space-between pa-3" style="backdrop-filter: blur(0.2px);">
                    <div>
                      <div class="text-h6 text-capitalize" style="color:white">{{ exercise.name }}</div>
                      <div class="small-muted" style="color:rgba(255,255,255,0.9)">Músculo: {{ translateToSpanish(exercise.target) }}</div>
                    </div>
                    <v-card-actions>
                      <v-btn text color="white" @click="showDetails(exercise)">Detalles</v-btn>
                      <v-btn icon variant="tonal" @click="addToSession(exercise)">
                        <v-icon>mdi-account-multiple-plus</v-icon>
                      </v-btn>
                    </v-card-actions>
                  </div>
                </template>
              </v-img>

              <div v-else class="pa-4">
                <div class="text-h6 text-capitalize">{{ exercise.name }}</div>
                <div class="small-muted text-capitalize">Músculo: {{ translateToSpanish(exercise.target) }}</div>
                <div class="mt-2">
                  <span class="badge" style="background:#fde68a">{{ translateToSpanish(exercise.equipment) }}</span>
                  <span class="badge" style="background:#c7d2fe; margin-left:8px">{{ translateToSpanish(exercise.bodyPart) }}</span>
                </div>
                <v-card-actions class="mt-2">
                  <v-btn color="red-darken-3" text @click="showDetails(exercise)">Detalles</v-btn>
                  <v-btn text @click="addToSession(exercise)">Añadir</v-btn>
                </v-card-actions>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- REAL-TIME SESSION PANEL -->
        <v-row class="mt-8">
          <v-col cols="12" md="6">
            <v-card elevation="2" class="pa-4">
              <div class="d-flex justify-space-between align-center mb-3">
                <div>
                  <h3>Sesión en tiempo real</h3>
                  <div class="small-muted">Conecta tu webcam y comparte la sesión con otros participantes.</div>
                </div>
                <v-btn :color="sessionActive ? 'success' : 'primary'" @click="toggleSession">
                  {{ sessionActive ? 'Detener sesión' : 'Iniciar sesión' }}
                </v-btn>
              </div>

              <div class="d-flex gap-3">
                <div style="flex:1;">
                  <video ref="localVideo" autoplay playsinline muted style="width:100%; border-radius:8px; background:#000"></video>
                  <div class="small-muted mt-1">Tu cámara</div>
                </div>

                <div style="width:250px">
                  <v-card outlined class="pa-3" style="height:100%">
                    <div class="d-flex justify-space-between">
                      <strong>Participantes</strong>
                      <span class="small-muted">{{ participants.length }} conectados</span>
                    </div>
                    <v-list dense>
                      <v-list-item v-for="p in participants" :key="p.id">
                        <v-list-item-avatar><v-icon>mdi-account-circle</v-icon></v-list-item-avatar>
                        <v-list-item-content>
                          <v-list-item-title>{{ p.name }}</v-list-item-title>
                          <v-list-item-subtitle class="small-muted">{{ p.status }}</v-list-item-subtitle>
                        </v-list-item-content>
                      </v-list-item>
                      <v-list-item v-if="participants.length===0">
                        <v-list-item-content class="small-muted">Nadie conectado</v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- EXERCISE DETAILS PANEL -->
          <v-col cols="12" md="6">
            <v-card elevation="2" class="pa-4">
              <h3>Detalles del ejercicio</h3>
              <div v-if="selectedExercise">
                <div class="text-h6 text-capitalize">{{ selectedExercise.name }}</div>
                <div class="small-muted text-capitalize">Parte del cuerpo: {{ translateToSpanish(selectedExercise.bodyPart) }}</div>
                <p><strong>Equipamiento:</strong> {{ translateToSpanish(selectedExercise.equipment) }}</p>
                <v-img v-if="selectedExercise.gifUrl" :src="selectedExercise.gifUrl.replace('http://','https://')" max-height="200"></v-img>
                <v-btn class="mt-3" color="red-darken-3" @click="addToSession(selectedExercise)">Añadir a sesión</v-btn>
              </div>
              <div v-else class="small-muted">Selecciona un ejercicio para ver detalles</div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- FOOTER -->
    <v-footer class="pa-4" height="64" style="background:transparent">
      <v-container>
        <div class="d-flex justify-space-between small-muted">
          <div>© {{ new Date().getFullYear() }} Virtual Trainer</div>
          <div>Hecho con ❤️ · <a href="#" @click.prevent="openDocs">Docs</a></div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { createVuetify } from 'vuetify';

const vuetify = createVuetify();

const search = ref('');
const exercises = ref([]);
const selectedExercise = ref(null);
const loading = ref(false);
const filterHasGif = ref(false);
const noResultsMessage = ref('');
const participants = ref([]);
const sessionActive = ref(false);
const localStream = ref(null);

const heroIllustration = ref('https://images.unsplash.com/photo-1599058917214-2ab4f2b7a4f4?q=80&w=800');

const API_URL = 'http://localhost:8080/api/exercises';

const filteredExercises = computed(() => {
  if (!filterHasGif.value) return exercises.value;
  return exercises.value.filter(e => e.gifUrl);
});

async function fetchExercises() {
  loading.value = true;
  noResultsMessage.value = '';
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    exercises.value = data;
  } catch (err) {
    noResultsMessage.value = 'Error fetching exercises: ' + err.message;
  } finally { loading.value = false; }
}

async function searchExercises() {
  if (!search.value) return fetchExercises();
  loading.value = true;
  noResultsMessage.value = '';
  try {
    const res = await fetch(`${API_URL}?search=${encodeURIComponent(search.value)}`);
    const data = await res.json();
    exercises.value = data;
    if (data.length === 0) noResultsMessage.value = `No exercises found for "${search.value}"`;
  } catch (err) { noResultsMessage.value = err.message; }
  finally { loading.value = false; }
}

function showDetails(ex) { selectedExercise.value = ex; }
function addToSession(ex) { participants.value.push({ id: Date.now(), name: ex.name, status: 'added' }); }

function onImageError(e, ex) { e.target.style.display='none'; }

async function toggleSession() {
  if (!sessionActive.value) {
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia({ video:true, audio:false });
      const video = document.querySelector('video');
      if (video) video.srcObject = localStream.value;
      sessionActive.value = true;
    } catch(err){ alert('Cannot access camera: '+err.message); }
  } else {
    if (localStream.value) { localStream.value.getTracks().forEach(t=>t.stop()); localStream.value=null; }
    sessionActive.value=false;
    participants.value=[];
  }
}

function translateToSpanish(term){
  if (!term) return 'No especificado';
  const map = { 'back':'espalda','chest':'pecho','lower arms':'antebrazos','lower legs':'piernas','neck':'cuello','shoulders':'hombros','upper arms':'brazos','upper legs':'piernas','waist':'cintura','core':'core','abs':'abdominales','biceps':'bíceps','calves':'pantorrillas','delts':'deltoides','glutes':'glúteos','hamstrings':'isquiotibiales','lats':'dorsales','pectorals':'pectorales','quads':'cuádriceps','traps':'trapecios','triceps':'tríceps','body weight':'peso corporal'};
  return map[String(term).toLowerCase()] || term;
}

function openDocs(){ alert('Abrir documentación'); }

onMounted(() => { fetchExercises(); });
</script>

<style>
body { font-family: 'Inter', system-ui, sans-serif; background:#f6f7fb; }
.card-hover { transition: transform .18s ease, box-shadow .18s ease; }
.card-hover:hover { transform: translateY(-6px); box-shadow:0 10px 30px rgba(16,24,40,0.12); }
.small-muted { font-size: .85rem; color: rgba(0,0,0,0.6); }
.badge { border-radius:999px; padding:4px 10px; font-size:.75rem; }
</style>
