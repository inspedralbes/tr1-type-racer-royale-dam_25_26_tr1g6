<template>
  <v-app>
    <v-app-bar color="background" flat app border>
      <v-container class="d-flex align-center py-0">
        <v-img
          src="https://cdn-icons-png.flaticon.com/512/3032/3032700.png"
          max-height="40"
          max-width="40"
          class="mr-3"
          alt="Gym Logo"
        ></v-img></v-container>
      <v-toolbar-title class="font-weight-bold text-h5 text-primary">
          Fit<span class="text-secondary">Toni</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="toggleTheme" class="ml-2">
          <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
        </v-btn>
      <v-chip v-if="wsConnected" color="success" label size="small">
        <v-icon start size="x-small">mdi-wifi</v-icon>
        Connected
      </v-chip>
      <v-chip v-else color="error" label size="small">
        <v-icon start size="x-small">mdi-wifi-off</v-icon>
        Offline
      </v-chip>
    </v-app-bar>

    <v-main class="bg-background">
      <v-container class="py-6 py-md-10">
        <v-tabs v-model="screen" color="primary" align-tabs="center" class="mb-6">
          <v-tab value="home">Virtual Trainer</v-tab>
          <v-tab value="typeracer">Exercise Finder</v-tab>
        </v-tabs></v-container

        <!-- Virtual Trainer Home Screen -->
        <v-container v-if="screen === 'home'" class="py-10">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card elevation="8" class="pa-8 rounded-xl">
              <v-card-title class="text-h4 mb-6">Welcome to Virtual Trainer</v-card-title>
              <v-card-text>
                <v-row>
                  <!-- Create Session Card -->
                  <v-col cols="12" md="6">
                    <v-card class="pa-6 rounded-lg" variant="tonal">
                      <v-card-title>Create Session</v-card-title>
                      <v-card-text>
                        <v-select
                          v-model="selectedExerciseId"
                          :items="exerciseOptions"
                          item-title="name"
                          item-value="id"
                          label="Select Exercise"
                          outlined
                          class="mb-4"
                        ></v-select>
                        
                        <v-card v-if="selectedExerciseDetails" outlined class="mb-4 pa-3" color="grey-100">
                          <v-card-text class="text-caption">
                            <strong>{{ selectedExerciseDetails.name }}</strong><br>
                            {{ selectedExerciseDetails.description }}<br>
                            <strong>Target Muscles:</strong> {{ selectedExerciseDetails.targetMuscles.join(', ') }}
                          </v-card-text>
                        </v-card>

                        <v-text-field
                          v-model="userNameCreate"
                          label="Your Name"
                          outlined
                          class="mb-4"
                        ></v-text-field>
                        <v-btn
                          color="primary"
                          block
                          @click="createSession"
                          rounded="lg"
                          :disabled="!selectedExerciseId || !userNameCreate"
                        >
                          Create Session
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>

                  <!-- Join Session Card -->
                  <v-col cols="12" md="6">
                    <v-card class="pa-6 rounded-lg" variant="tonal">
                      <v-card-title>Join Session</v-card-title>
                      <v-card-text>
                        <v-text-field
                          v-model="sessionIdInput"
                          label="Session ID"
                          outlined
                          class="mb-4"
                          hint="Ask the session creator for the ID"
                        ></v-text-field>
                        <v-text-field
                          v-model="userNameJoin"
                          label="Your Name"
                          outlined
                          class="mb-4"
                        ></v-text-field>
                        <v-btn
                          color="primary"
                          block
                          @click="joinSession"
                          rounded="lg"
                          :disabled="!sessionIdInput || !userNameJoin"
                        >
                          Join Session
                        </v-btn>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

        <!-- Type Racer Royale Screen -->
        <v-container v-else-if="screen === 'typeracer'" class="py-6">
          <v-row justify="center" class="mb-8">
            <v-col cols="12" lg="10" xl="8">
              <v-sheet rounded="xl" elevation="6" class="pa-4 pa-md-6 bg-surface">
                <v-row justify="center" align="center">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="search"
                      label="Buscar ejercicio (ej: bench press, squat)"
                      prepend-inner-icon="mdi-magnify"
                      :append-inner-icon="search ? 'mdi-close' : ''"
                      @click:append-inner="clearSearch"
                      color="primary"
                      variant="solo-filled"
                      clearable
                      hide-details="auto"
                      persistent-hint
                      hint="La búsqueda puede tardar unos segundos. Recomendamos usar términos en inglés."
                      class="mb-4 mb-md-0"
                      @keyup.enter="searchExercises"
                    />
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-btn
                      color="primary"
                      block
                      size="large"
                      :loading="loading && loadingType === 'search'"
                      @click="searchExercises"
                      class="font-weight-bold"
                    >
                      <v-icon left>mdi-magnify</v-icon>
                      Buscar
                    </v-btn>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-switch
                      v-model="filterHasGif"
                      label="Mostrar solo con GIF/Imagen"
                      color="secondary"
                      hide-details
                      inset
                      class="d-flex justify-center justify-md-start"
                    ></v-switch>
                  </v-col>
                </v-row>
              </v-sheet>
            </v-col>
          </v-row>

          <v-row justify="center">
            <v-col cols="12" lg="10" xl="8">
              <v-alert v-if="error" type="error" icon="mdi-alert-circle" variant="tonal" class="mb-6" closable @input="error = ''">
                <span class="font-weight-bold">{{ error }}</span>
              </v-alert>
            </v-col>
          </v-row>

          <v-row v-if="loading && (loadingType === 'initial' || loadingType === 'search')" justify="center">
            <v-col cols="12" md="8" class="text-center pa-10">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4 text-h6 text-medium-emphasis">{{ loadingMessage }}</p>
            </v-col>
          </v-row>

          <v-row v-if="!(loading && (loadingType === 'initial' || loadingType === 'search'))">
            <v-col v-for="exercise in filteredExercises" :key="exercise.id" cols="12" sm="6" md="4" lg="3">

              <v-card
                class="exercise-card mx-auto my-3"
                max-width="400"
                elevation="4"
                rounded="lg"
                @click="showDetails(exercise)"
                v-intersect="(isIntersecting) => handleIntersection(isIntersecting, exercise)"
              >
                <div class="card-image-container">
                  <v-img
                    v-if="exercise.gifUrl"
                    :src="exercise.gifUrl.replace('http://', 'https://')"
                    height="200px"
                    cover
                    class="card-image"
                  ></v-img>

                  <v-img
                    v-else-if="exercise.thumbnailUrl"
                    :src="exercise.thumbnailUrl"
                    height="200px"
                    cover
                    class="card-image"
                  ></v-img>

                  <v-responsive v-else height="200px" class="bg-grey-darken-3 d-flex align-center justify-center card-image">
                    <v-progress-circular
                      v-if="exercise.thumbnailLoading"
                      indeterminate
                      color="primary"
                      size="50"
                    ></v-progress-circular>
                    <v-icon v-else color="grey-darken-1" size="80">mdi-dumbbell</v-icon>
                  </v-responsive>

                  <div class="card-overlay d-flex align-end pa-3">
                    <v-btn icon size="small" variant="flat" color="primary">
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                  </div>
                </div>

                <v-card-title class="text-capitalize pt-4 pb-2 text-wrap font-weight-bold text-primary">{{ exercise.name }}</v-card-title>

                <v-card-text class="pt-0 pb-2">
                  <v-chip size="small" color="secondary" variant="flat" class="mr-2 mb-2">
                    <v-icon start size="18" :icon="getBodyPartIcon(exercise.bodyPart)"></v-icon>
                    {{ translateToSpanish(exercise.bodyPart) }}
                  </v-chip>
                  <v-chip size="small" color="primary" variant="flat" class="mb-2">
                    <v-icon start size="18" icon="mdi-target"></v-icon>
                    {{ translateToSpanish(exercise.target) }}
                  </v-chip>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col v-if="!loading && filteredExercises.length === 0" cols="12">
              <v-alert type="info" icon="mdi-information" variant="tonal" class="text-center mx-auto my-8" max-width="600">
                  {{ noResultsMessage || 'No se encontraron ejercicios con estos criterios. Prueba a buscar de nuevo o ajusta los filtros.' }}
              </v-alert>
            </v-col>

            <v-col v-if="loading && loadingType === 'infinity-scroll'" cols="12" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="40" width="4"></v-progress-circular>
              <p class="mt-3 text-grey-lighten-1">Cargando más ejercicios...</p>
            </v-col>
          </v-row>

          <v-dialog v-model="detailsDialog" max-width="800" scrollable transition="dialog-bottom-transition">
            <v-card v-if="selectedExercise" rounded="xl" class="bg-surface">
              <v-toolbar color="primary" flat>
                <v-toolbar-title class="text-h5 text-capitalize text-wrap font-weight-bold">
                  {{ selectedExercise.name }}
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="detailsDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-toolbar>

              <v-tabs v-model="tab" color="secondary" align-tabs="center" grow class="bg-background">
                <v-tab value="instructions" class="font-weight-bold">
                  <v-icon start>mdi-robot-outline</v-icon>Instrucciones (IA)
                </v-tab>
                <v-tab value="details" class="font-weight-bold">
                  <v-icon start>mdi-information-outline</v-icon>Detalles y Demo
                </v-tab>
              </v-tabs>

              <v-divider></v-divider>

              <v-card-text class="pa-0">
                <v-window v-model="tab">

                  <v-window-item value="instructions" class="pa-6">
                    <h3 class="text-h6 font-weight-bold text-primary mb-4">Guía de Ejecución (por Gemini)</h3>
                    <div v-if="instructionsLoading" class="text-center pa-10">
                      <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
                      <p class="mt-3 text-grey-lighten-1">Generando instrucciones personalizadas...</p>
                    </div>
                    <div v-else class="mt-3 instructions-content text-medium-emphasis" style="white-space: pre-wrap;">
                      {{ generatedInstructions }}
                    </div>
                  </v-window-item>

                  <v-window-item value="details" class="pa-6">
                    <h3 class="text-h6 font-weight-bold text-primary mb-4">Demostración Visual</h3>

                    <v-img
                      v-if="selectedExercise.gifUrl"
                      :src="selectedExercise.gifUrl.replace('http://', 'https://')"
                      class="mb-6 rounded-lg elevation-2"
                      max-height="350"
                      contain
                    ></v-img>

                    <div v-else>
                      <div v-if="youtubeLoading" class="text-center pa-10">
                        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
                        <p class="mt-3 text-grey-lighten-1">Buscando video de demostración...</p>
                      </div>

                      <v-responsive v-else-if="youtubeVideoId" aspect-ratio="16/9" class="mb-6 rounded-lg elevation-2">
                        <iframe
                          width="100%"
                          height="100%"
                          :src="`https://www.youtube.com/embed/${youtubeVideoId}`"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                          class="rounded-lg"
                        ></iframe>
                      </v-responsive>

                      <v-img
                        v-else-if="selectedExercise.thumbnailUrl"
                        :src="selectedExercise.thumbnailUrl"
                        class="mb-6 rounded-lg elevation-2"
                        max-height="350"
                        contain
                      ></v-img>

                      <v-alert v-else type="warning" variant="tonal" class="text-center mx-auto my-8">
                        No se encontró ni GIF, ni video, ni miniatura de demostración.
                      </v-alert>
                    </div>
                    <h3 class="text-h6 font-weight-bold text-primary mb-4">Especificaciones del Ejercicio</h3>
                    <v-list class="bg-transparent">
                      <v-list-item class="mb-2" prepend-icon="mdi-arm-flex" :title="translateToSpanish(selectedExercise.bodyPart)" subtitle="Parte del Cuerpo"></v-list-item>
                      <v-list-item class="mb-2" prepend-icon="mdi-target" :title="translateToSpanish(selectedExercise.target)" subtitle="Músculo Objetivo"></v-list-item>
                      <v-list-item class="mb-2" prepend-icon="mdi-weight-lifter" :title="translateToSpanish(selectedExercise.equipment)" subtitle="Equipamiento Necesario"></v-list-item>
                    </v-list>
                  </v-window-item>

                </v-window>
              </v-card-text>

              <v-divider></v-divider>
              <v-card-actions class="pa-4 bg-background">
                <v-spacer></v-spacer>
                <v-btn color="secondary" variant="flat" @click="detailsDialog = false" class="font-weight-bold">
                  Cerrar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-container>

      <!-- Training Screen -->
      <v-container v-else-if="screen === 'training'" class="py-6">
        <v-row>
          <v-col cols="12" md="8">
            <v-card elevation="8" class="rounded-xl">
              <v-card-title>{{ currentExerciseName }} Training Session</v-card-title>
              <v-card-text>
                <div style="position: relative; width: 100%; max-width: 600px; margin: 0 auto;">
                  <video
                    ref="videoElement"
                    autoplay
                    playsinline
                    style="width: 100%; border: 2px solid #ccc; border-radius: 8px; display: block;"
                  ></video>
                  <canvas
                    ref="canvasElement"
                    style="position: absolute; top: 0; left: 0; width: 100%; border-radius: 8px;"
                  ></canvas>
                </div>

                <!-- Debug Info -->
                <v-card class="mt-4 pa-3 rounded-lg" variant="tonal">
                  <v-card-text class="text-caption">
                    <strong>Debug Info:</strong><br>
                    Pose Confidence: {{ (poseConfidence * 100).toFixed(0) }}%<br>
                    Current Angle: {{ currentAngle.toFixed(0) }}°<br>
                    State: {{ repState }}
                  </v-card-text>
                </v-card>

                <v-row class="mt-4 mb-4">
                  <v-col cols="6">
                    <v-card class="pa-4 text-center rounded-lg" variant="tonal">
                      <div class="text-h6">Reps</div>
                      <div class="text-h3 font-weight-bold text-primary">{{ repCount }}</div>
                    </v-card>
                  </v-col>
                  <v-col cols="6">
                    <v-card class="pa-4 text-center rounded-lg" variant="tonal">
                      <div class="text-h6">Quality</div>
                      <div class="text-h3 font-weight-bold" :class="qualityColor">
                        {{ (currentQuality * 100).toFixed(0) }}%
                      </div>
                    </v-card>
                  </v-col>
                </v-row>

                <v-row class="mb-4">
                  <v-col cols="12">
                    <v-btn
                      v-if="!sessionActive"
                      color="success"
                      block
                      size="large"
                      @click="startTraining"
                      rounded="lg"
                    >
                      Start Training
                    </v-btn>
                    <v-btn
                      v-else
                      color="error"
                      block
                      size="large"
                      @click="endTraining"
                      rounded="lg"
                    >
                      End Training
                    </v-btn>
                  </v-col>
                </v-row>

                <v-alert v-if="feedback" type="success" class="mb-4">
                  {{ feedback }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Leaderboard and Session Info -->
          <v-col cols="12" md="4">
            <v-card elevation="8" class="mb-4 rounded-xl">
              <v-card-title>Participants</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="(entry, index) in sortedLeaderboard"
                    :key="entry.id"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary" size="small">{{ index + 1 }}</v-avatar>
                    </template>
                    <v-list-item-title>{{ entry.name }}</v-list-item-title>
                    <template v-slot:append>
                      <v-chip color="success" label size="small">{{ entry.reps }} reps</v-chip>
                    </template>
                  </v-list-item>
                  <v-list-item v-if="sortedLeaderboard.length === 0">
                    <v-list-item-title class="text-grey">Waiting for participants...</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <v-card elevation="8" class="rounded-xl">
              <v-card-title>Session Info</v-card-title>
              <v-card-text>
                <p><strong>Session ID:</strong></p>
                <p class="text-caption break-word font-weight-bold">{{ sessionId }}</p>
                <v-btn
                  size="small"
                  color="primary"
                  class="mt-2"
                  @click="copySessionId"
                  rounded="lg"
                >
                  Copy ID
                </v-btn>
                <p class="mt-4"><strong>Exercise:</strong> {{ currentExerciseName }}</p>
                <p><strong>Status:</strong> {{ sessionActive ? 'Active' : 'Waiting' }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <!-- Results Screen -->
      <v-container v-else-if="screen === 'results'" class="py-10">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-card elevation="8" class="rounded-xl">
              <v-card-title class="text-h4 mb-6">Session Results</v-card-title>
              <v-card-text>
                <v-row class="mb-6">
                  <v-col cols="12" md="6">
                    <v-card class="pa-6 text-center rounded-lg" variant="tonal">
                      <div class="text-h6 mb-2">Exercise</div>
                      <div class="text-h5 font-weight-bold">{{ currentExerciseName }}</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card class="pa-6 text-center rounded-lg" variant="tonal">
                      <div class="text-h6 mb-2">Your Reps</div>
                      <div class="text-h5 font-weight-bold text-success">{{ repCount }}</div>
                    </v-card>
                  </v-col>
                </v-row>

                <v-card class="pa-6 mb-6 rounded-xl" variant="tonal">
                  <v-card-title>Final Leaderboard</v-card-title>
                  <v-card-text>
                    <v-list>
                      <v-list-item
                        v-for="(entry, index) in sortedLeaderboard"
                        :key="entry.id"
                        class="mb-2"
                      >
                        <template v-slot:prepend>
                          <v-avatar
                            :color="index === 0 ? 'amber' : index === 1 ? 'grey' : 'orange'"
                            size="small"
                          >
                            {{ index + 1 }}
                          </v-avatar>
                        </template>
                        <v-list-item-title>{{ entry.name }}</v-list-item-title>
                        <template v-slot:append>
                          <v-chip color="primary" label size="small">{{ entry.reps }} reps</v-chip>
                        </template>
                      </v-list-item>
                    </v-list>
                  </v-card-text>
                </v-card>

                <v-btn color="primary" block size="large" @click="goHome" rounded="lg">
                  Back to Home
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="showLoadingSnackbar"
      :timeout="-1"
      color="primary"
      location="bottom right"
      variant="elevated"
    >
      <v-progress-circular indeterminate size="24" width="3" color="white" class="mr-3"></v-progress-circular>
      <span>{{ loadingSnackbarMessage }}</span>
    </v-snackbar>

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { useTheme } from 'vuetify'
import { useWebSocket } from '@/composables/useWebSocket'
import { usePoseDetection } from '@/composables/usePoseDetection'
import { useExerciseAnalyzer } from '@/composables/useExerciseAnalyzer'

// Screen states
const screen = ref('home')

// Exercise data
const exercises = ref([])
const selectedExerciseId = ref(null)

// Session data
const sessionId = ref('')
const isDarkTheme = ref(true) // For theme toggle
const theme = useTheme() // For theme toggle

// Type Racer Royale Data
const search = ref('')
const exercisesTypeRacer = ref([]) // Renamed to avoid conflict
const selectedExercise = ref(null)
const loading = ref(true)
const loadingType = ref('')
const loadingMessage = ref('')
const error = ref('')
const detailsDialog = ref(false)
const noResultsMessage = ref('')
const filterHasGif = ref(true)
const generatedInstructions = ref('')
const instructionsLoading = ref(false)
const tab = ref('instructions')
const page = ref(0)
const hasMore = ref(true)
const loadingSnackbarMessage = ref('')
const showLoadingSnackbar = ref(false)
const youtubeVideoId = ref(null)
const youtubeLoading = ref(false)

// API Keys and Setup (Replace with your actual keys)
const GEMINI_API_KEY = 'AIzaSyB15TiFdWSVMil5NvbLGiivNl_kxXragvQ' // Placeholder - User must replace
const API_KEY = '63e7cf7012msh5e3ce60374b5b8ap1a0ac6jsne3d3901068fb' // Placeholder - User must replace
const YOUTUBE_API_KEY = 'AIzaSyA2_JUS03YsPJ5UDHD7WV0mP8PvfdXBVo8' // Placeholder - User must replace
const PEXELS_API_KEY = 'hXiUs6wTpVBSOUEfCTuf2fdVhpGHNSiTt7hAzoUc78VjLgrQpByDfSGT' // Placeholder - User must replace

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

const API_HOST = 'exercisedb.p.rapidapi.com'
const API_URL_SEARCH = 'https://exercisedb.p.rapidapi.com/exercises/name/'
const API_URL_ALL = 'https://exercisedb.p.rapidapi.com/exercises'

// Session data
const participantId = ref('')
const currentExerciseName = ref('')
const sessionActive = ref(false)


// Form inputs
const userNameCreate = ref('')
const userNameJoin = ref('')
const sessionIdInput = ref('')

// Leaderboard and Reps
const leaderboard = ref({})
const myReps = ref(0)

// Refs for video and canvas
const videoElement = ref(null)
const canvasElement = ref(null)

// Composable Setup
const { ws, wsConnected, send, handleWebSocketMessage } = useWebSocket('ws://localhost:8080', {
  repetition_update: (data) => {
    if (!leaderboard.value[data.participantId]) {
      leaderboard.value[data.participantId] = { reps: 0, name: data.name || data.participantId }
    }
    leaderboard.value[data.participantId].reps = data.reps
    if (data.participantId === participantId.value) {
      myReps.value = data.reps
    }
  },
  participant_joined: (data) => {
    if (data.participants) {
      data.participants.forEach(p => {
        if (!leaderboard.value[p.id]) {
          leaderboard.value[p.id] = { reps: 0, name: p.name }
        }
      })
    }
  },
  session_state: (data) => {
    currentExerciseName.value = data.exercise;
    leaderboard.value = data.leaderboard.reduce((acc, p) => {
      acc[p.id] = { reps: p.reps, name: p.name };
      return acc;
    }, {});
  },
  session_ended: () => {
    screen.value = 'results'
  },
  participant_left: (data) => {
    if (data.participants) {
      const remainingIds = data.participants.map(p => p.id)
      Object.keys(leaderboard.value).forEach(id => {
        if (!remainingIds.includes(id)) {
          delete leaderboard.value[id]
        }
      })
    }
  }
})

const {
  repCount,
  currentQuality,
  feedback,
  currentAngle,
  repState,
  qualityColor,
  analyzeExercise,
  setRepCount
} = useExerciseAnalyzer(currentExerciseName, (payload) => {
  send('repetition', {
    sessionId: sessionId.value,
    participantId: participantId.value,
    payload
  })
})

const {
  poseConfidence,
  startPoseDetection,
  stopPoseDetection
} = usePoseDetection(videoElement, canvasElement, analyzeExercise)

// Computed properties
const exerciseOptions = computed(() => exercises.value)

const selectedExerciseDetails = computed(() => {
  if (!selectedExerciseId.value) return null
  return exercises.value.find(e => e.id === selectedExerciseId.value)
})

const filteredExercises = computed(() => {
  if (!filterHasGif.value) {
    return exercisesTypeRacer.value
  }
  return exercisesTypeRacer.value.filter(exercise => exercise.gifUrl || exercise.thumbnailUrl)
})

const sortedLeaderboard = computed(() => {
  return Object.entries(leaderboard.value)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.reps - a.reps)
})

watch(myReps, (newReps) => {
  setRepCount(newReps)
})

// Load exercises from API (Virtual Trainer)
async function loadExercises() {
  try {
    const response = await fetch('http://localhost:8080/api/exercises')
    if (response.ok) {
      exercises.value = await response.json()
      console.log('Virtual Trainer Exercises loaded:', exercises.value)
    }
  } catch (error) {
    console.error('Failed to load Virtual Trainer exercises:', error)
  }
}

// --- Type Racer Royale Functions ---

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value
  theme.global.name.value = isDarkTheme.value ? 'darkTheme' : 'light'
}

function clearSearch() {
  search.value = ''
  if (!error.value) {
    fetchInitialExercises()
  }
}

function getBodyPartIcon(bodyPart) {
  const icons = {
    'back': 'mdi-spine',
    'cardio': 'mdi-run-fast',
    'chest': 'mdi-chest',
    'lower arms': 'mdi-hand-extended-outline',
    'lower legs': 'mdi-leg-flex',
    'neck': 'mdi-head-outline',
    'shoulders': 'mdi-shoulder',
    'upper arms': 'mdi-arm-flex',
    'upper legs': 'mdi-leg-flex',
    'waist': 'mdi-human-pregnant',
    'core': 'mdi-human-pregnant',
    'full body': 'mdi-human-male-height',
  }
  return icons[bodyPart.toLowerCase()] || 'mdi-dumbbell'
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function translateToSpanish(term) {
  if (!term) return 'No especificado'
  
  const translations = {
    'back': 'espalda', 'cardio': 'cardio', 'chest': 'pecho', 'lower arms': 'antebrazos',
    'lower legs': 'piernas (inferior)', 'neck': 'cuello', 'shoulders': 'hombros', 'upper arms': 'brazos (superior)',
    'upper legs': 'piernas (superior)', 'waist': 'cintura', 'core': 'core',
    'abductors': 'abductores', 'abs': 'abdominales', 'adductors': 'aductores',
    'biceps': 'bíceps', 'calves': 'pantorrillas', 'cardiovascular system': 'sistema cardiovascular',
    'delts': 'deltoides', 'forearms': 'antebrazos', 'glutes': 'glúteos',
    'hamstrings': 'isquiotibiales', 'lats': 'dorsales', 'pectorals': 'pectorales',
    'quads': 'cuádriceps', 'spine': 'espina dorsal', 'traps': 'trapecios',
    'triceps': 'tríceps', 'upper back': 'espalda alta', 'full body': 'cuerpo completo',
    'assisted': 'asistido', 'band': 'banda elástica', 'barbell': 'barra',
    'body weight': 'peso corporal', 'bosu ball': 'bosu', 'cable': 'cable',
    'dumbbell': 'mancuerna', 'ez barbell': 'barra EZ', 'kettlebell': 'kettlebell (pesa rusa)',
    'medicine ball': 'balón medicinal', 'olympic barbell': 'barra olímpica', 'resistance band': 'banda de resistencia',
    'roller': 'rodillo', 'rope': 'cuerda', 'smith machine': 'máquina smith',
    'stability ball': 'bola de estabilidad', 'tire': 'neumático', 'trap bar': 'barra hexagonal',
    'weighted': 'con peso', 'wheel roller': 'rueda abdominal', 'leverage machine': 'máquina de palanca',
    'plate': 'disco', 'sledgehammer': 'martillo', 'step-up box': 'cajón de step-up', 'weighted plate': 'disco con peso',
    'elliptical machine': 'máquina elíptica', 'stationary bike': 'bicicleta estática', 'treadmill': 'cinta de correr',
    'recumbent bike': 'bicicleta reclinada', 'stairclimber': 'escaladora', 'rower': 'máquina de remo'
  }

  return translations[term.toLowerCase()] || term
}

async function fetchInitialExercises() {
  loading.value = true
  loadingType.value = 'initial'
  loadingMessage.value = 'Cargando tu dosis de motivación...'
  error.value = ''
  noResultsMessage.value = ''
  page.value = 0
  exercisesTypeRacer.value = []
  hasMore.value = true

  try {
    const response = await fetch(`${API_URL_ALL}?limit=200`, {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
    })
    if (!response.ok) {
      if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera antes de reintentar.')
      throw new Error(`Error al cargar ejercicios iniciales: ${response.statusText}.`)
    }
    const data = await response.json()
    const exercisesWithThumbnails = data.map(ex => ({
      ...ex,
      thumbnailUrl: null,
      thumbnailLoading: false
    }))

    exercisesTypeRacer.value = shuffleArray(exercisesWithThumbnails)

    exercisesTypeRacer.value = exercisesTypeRacer.value.slice(0, 20)
    hasMore.value = exercisesTypeRacer.value.length < data.length
  } catch (err) {
    error.value = err.message
    noResultsMessage.value = 'No se pudieron cargar los ejercicios. Verifica tu conexión y API Keys.'
    hasMore.value = false
  } finally {
    loading.value = false
    loadingType.value = ''
  }
}

async function fetchMoreExercises() {
  if (loading.value || !hasMore.value || search.value) return

  loading.value = true
  loadingType.value = 'infinity-scroll'
  loadingSnackbarMessage.value = 'Cargando más ejercicios...'
  showLoadingSnackbar.value = true

  try {
    if (search.value.trim()) {
      hasMore.value = false
      return
    }

    page.value++

    const response = await fetch(`${API_URL_ALL}?limit=1000`, {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
    })
    if (!response.ok) {
      if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera antes de reintentar.')
      throw new Error(`Error al cargar más ejercicios: ${response.statusText}.`)
    }
    const data = await response.json()

    const newRandomExercises = shuffleArray(data).slice(0, 20).map(ex => ({
      ...ex,
      thumbnailUrl: null,
      thumbnailLoading: false
    }))

    const uniqueNewExercises = newRandomExercises.filter(
      (newEx) => !exercisesTypeRacer.value.some((existingEx) => existingEx.id === newEx.id)
    )

    exercisesTypeRacer.value.push(...uniqueNewExercises)
    hasMore.value = true
  } catch (err) {
    error.value = err.message
    hasMore.value = false
  } finally {
    loading.value = false
    loadingType.value = ''
    showLoadingSnackbar.value = false
  }
}

async function searchExercises() {
  if (!search.value.trim()) {
    error.value = "Por favor, ingresa un nombre de ejercicio para buscar."
    await nextTick()
    return
  }

  loading.value = true
  loadingType.value = 'search'
  loadingMessage.value = `Buscando "${search.value}"...`
  error.value = ''
  noResultsMessage.value = ''
  exercisesTypeRacer.value = []
  hasMore.value = false

  try {
    const response = await fetch(`${API_URL_SEARCH}${search.value.toLowerCase()}?limit=100`, {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
    })
    if (!response.ok) {
      if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera antes de reintentar.')
      throw new Error(`Error al buscar: ${response.statusText}.`)
    }

    const data = await response.json()

    exercisesTypeRacer.value = data.map(ex => ({
      ...ex,
      thumbnailUrl: null,
      thumbnailLoading: false
    }))

    if (data.length === 0) {
      noResultsMessage.value = `No se encontraron ejercicios para "${search.value}". Intenta otra palabra clave.`
    }
  } catch (err) {
    error.value = `Ocurrió un error al buscar: ${err.message}`
  } finally {
    loading.value = false
    loadingType.value = ''
  }
}

async function showDetails(exercise) {
  selectedExercise.value = exercise
  detailsDialog.value = true
  tab.value = 'instructions'

  youtubeVideoId.value = null
  youtubeLoading.value = false

  instructionsLoading.value = true
  generatedInstructions.value = ''
  generateGeminiInstructions(exercise)

  if (!exercise.gifUrl) {
    youtubeLoading.value = true
    try {
      const query = `${exercise.name} ${translateToSpanish(exercise.target)} ejercicio tutorial`
      const youtubeResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`)

      const youtubeData = await youtubeResponse.json()
      if (youtubeData.items && youtubeData.items.length > 0) {
        youtubeVideoId.value = youtubeData.items[0].id.videoId
      }
    } catch (err) {
      console.error("Error al buscar video de YouTube:", err)
    } finally {
      youtubeLoading.value = false
    }
  }
}

async function generateGeminiInstructions(exercise) {
  try {
    const prompt = `Eres un entrenador personal de élite. Tu especialidad es dar instrucciones claras y motivadoras en **español**, con un tono profesional y técnico pero fácil de entender.

Genera las instrucciones detalladas para el siguiente ejercicio:
- **Ejercicio:** "${exercise.name}"
- **Músculo Principal:** ${translateToSpanish(exercise.target)}
- **Parte del Cuerpo:** ${translateToSpanish(exercise.bodyPart)}
- **Equipamiento:** ${translateToSpanish(exercise.equipment)}

Estructura tu respuesta **exactamente** de la siguiente manera, usando un formato de texto plano con encabezados en negrita, guiones para listas y números para pasos secuenciales. Cada sección debe ser clara y concisa.

---
**🎯 Objetivo del Ejercicio:**
(Breve descripción del beneficio principal y los músculos involucrados)

**🛠️ Preparación:**
- **Paso 1:** (Detalle de la configuración del equipo y la posición inicial del cuerpo)
- **Paso 2:** (Ajustes de postura, agarre o anclaje antes de iniciar el movimiento)

**🚀 Ejecución (paso a paso):**
1. **Fase Concéntrica (Ascenso/Empuje):** (Describe el inicio del movimiento, cómo generar fuerza y la respiración)
2. **Punto de Máxima Contracción:** (Detalla la posición clave o el pico de esfuerzo)
3. **Fase Excéntrica (Descenso/Retorno):** (Describe el control del movimiento de vuelta a la posición inicial y la respiración)
4. **Finalización:** (Cómo completar una repetición de forma segura y prepararse para la siguiente)

**💡 Consejos de Profesional:**
- **Técnica Óptima:** (Un consejo clave para mejorar la forma y la activación muscular)
- **Errores Comunes a Evitar:** (Un error frecuente y cómo corregirlo)
- **Conexión Mente-Músculo:** (Sugerencia para maximizar la efectividad del ejercicio)

**🌟 ¡A entrenar fuerte!**
(Frase final de motivación)
---
`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    generatedInstructions.value = text

  } catch (err) {
    console.error("Error al generar instrucciones con Gemini:", err)
    generatedInstructions.value = 'Error: No se pudieron generar las instrucciones. Verifica tu API Key de Gemini y tu conexión a internet.'
  } finally {
    instructionsLoading.value = false
  }
}

async function fetchPexelsThumbnail(exercise) {
  if (exercise.thumbnailLoading || !PEXELS_API_KEY || PEXELS_API_KEY.includes('TU_API_KEY')) {
    exercise.thumbnailLoading = false
    return
  }

  exercise.thumbnailLoading = true

  try {
    const query = `${exercise.name} ${translateToSpanish(exercise.target)} gym`
    const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    })

    if (!response.ok) {
      if (response.status === 429) console.error('Límite de Pexels API alcanzado.')
      throw new Error('Error en la API de Pexels')
    }

    const data = await response.json()
    if (data.photos && data.photos.length > 0) {
      exercise.thumbnailUrl = data.photos[0].src.medium
    } else {
      const fallbackQuery = `${translateToSpanish(exercise.target)} exercise`
      const fallbackResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(fallbackQuery)}&per_page=1&orientation=landscape`, {
        headers: { 'Authorization': PEXELS_API_KEY }
      })
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.photos && fallbackData.photos.length > 0) {
          exercise.thumbnailUrl = fallbackData.photos[0].src.medium
        }
      }
    }

  } catch (err) {
    console.error("Error al buscar miniatura en Pexels:", err)
  } finally {
    exercise.thumbnailLoading = false
  }
}

let scrollContainer = null

function handleScroll() {
  if (loading.value || !hasMore.value || search.value) {
    return
  }

  let scrollHeight, scrollTop, clientHeight

  if (scrollContainer === window) {
    scrollHeight = document.documentElement.scrollHeight
    scrollTop = window.pageYOffset || document.documentElement.scrollTop
    clientHeight = document.documentElement.clientHeight
  } else {
    scrollHeight = scrollContainer.scrollHeight
    scrollTop = scrollContainer.scrollTop
    clientHeight = scrollContainer.clientHeight
  }

  if (scrollTop + clientHeight >= scrollHeight - 300) {
    fetchMoreExercises()
  }
}

async function handleIntersection(isIntersecting, exercise) {
  if (isIntersecting && !exercise.gifUrl && !exercise.thumbnailUrl && !exercise.thumbnailLoading) {
    await fetchPexelsThumbnail(exercise)
  }
}

onMounted(async () => {
  await loadExercises()
  await fetchInitialExercises()
  scrollContainer = document.querySelector('v-main')
  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', handleScroll)
  } else {
    window.addEventListener('scroll', handleScroll)
    scrollContainer = window
  }
})

onUnmounted(() => {
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', handleScroll)
  } else {
    window.removeEventListener('scroll', handleScroll)
  }
})

// Generate IDs
function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9)
}

// Create session
function createSession() {
  sessionId.value = 'session_' + Math.random().toString(36).substr(2, 9)
  participantId.value = generateId()
  const exercise = exercises.value.find(e => e.id === selectedExerciseId.value)
  currentExerciseName.value = exercise.name
  leaderboard.value = {}
  repCount.value = 0
  connectWebSocket()
  screen.value = 'training'
}

// Join session
function joinSession() {
  sessionId.value = sessionIdInput.value
  participantId.value = generateId()
  leaderboard.value = {}
  repCount.value = 0
  connectWebSocket()
  screen.value = 'training'
}

// Connect WebSocket
function connectWebSocket() {
  const exercise = exercises.value.find(e => e.id === selectedExerciseId.value)
  currentExerciseName.value = exercise ? exercise.name : 'Unknown'

  send('join', {
    sessionId: sessionId.value,
    participantId: participantId.value,
    payload: {
      name: userNameCreate.value || userNameJoin.value,
      exercise: currentExerciseName.value
    }
  })
}

// Start training
function startTraining() {
  sessionActive.value = true
  startPoseDetection()
}

// End training
function endTraining() {
  sessionActive.value = false
  stopPoseDetection()
  send('session_end', {
    sessionId: sessionId.value,
    participantId: participantId.value
  })
}

// Go home
function goHome() {
  screen.value = 'home'
  selectedExerciseId.value = null
  userNameCreate.value = ''
  sessionIdInput.value = ''
  userNameJoin.value = ''
  if (ws) ws.close()
}

// Copy session ID to clipboard
function copySessionId() {
  navigator.clipboard.writeText(sessionId.value)

}

onMounted(async () => {
  await loadExercises()
})

onUnmounted(() => {
  stopPoseDetection()
  if (ws) ws.close()
})
</script>

<style scoped>
.break-word {
  word-break: break-all;
}
</style>
