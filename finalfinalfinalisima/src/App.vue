<template>
  <v-app>
    <LoginRegister v-if="!isAuthenticated" />

    <div v-else>
      <v-overlay v-model="isProcessingVideo" class="d-flex justify-center align-center" persistent>
        <div class="text-center pa-4 bg-surface rounded-xl" style="min-width: 300px;">
          <p class="text-h6 mb-4">Analizando video de referencia...</p>
          <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
        </div>
      </v-overlay>

      <v-app-bar color="surface" flat app border height="80"> 
        <v-container class="d-flex align-center py-0 fill-height">
          <v-img :src="fitToniLogo" alt="FitToni Logo" contain max-width="70" max-height="70" @click="goHome" style="cursor: pointer; border-radius: 12px; margin-right: 16px;"/>
          <v-toolbar-title class="font-weight-bold text-h5 text-primary" @click="goHome" style="cursor: pointer;">Fit<span class="text-secondary">Toni</span></v-toolbar-title>
          <v-spacer></v-spacer>
          <v-menu>
            <template v-slot:activator="{ props }"><v-btn icon v-bind="props"><v-avatar color="primary" size="40">{{ userInitials }}</v-avatar></v-btn></template>
            <v-list>
              <v-list-item title="Perfil" @click="navigateTo('profile')" prepend-icon="mdi-account-cog"></v-list-item>
              <v-list-item title="Estadísticas" @click="navigateTo('statistics')" prepend-icon="mdi-chart-bar"></v-list-item>
              <v-divider></v-divider>
              <v-list-item title="Logout" @click="logout" prepend-icon="mdi-logout"></v-list-item>
            </v-list>
          </v-menu>
          <v-chip v-if="wsConnected" color="success" label size="small" class="ml-3"><v-icon start size="x-small">mdi-wifi</v-icon>Connected</v-chip>
          <v-chip v-else color="error" label size="small" class="ml-3"><v-icon start size="x-small">mdi-wifi-off</v-icon>Offline</v-chip>
        </v-container>
      </v-app-bar>

      <v-main class="bg-background">
        <div v-if="screen === 'home'">
          <v-container class="py-10">
            <v-row justify="center"><v-col cols="12" md="10" lg="8"><v-card elevation="12" class="pa-8 rounded-xl bg-surface mb-6"><v-card-title class="text-h4 font-weight-bold text-center mb-6 text-primary">Start Your Virtual Training Session</v-card-title><v-card-text><v-row><v-col cols="12" md="6"><v-card class="pa-6 rounded-lg bg-background"><v-card-title class="text-h6 mb-4">1. Create a New Session</v-card-title><v-text-field v-model="userNameCreate" label="Your Name" variant="outlined" class="mb-4" hide-details></v-text-field><v-btn color="primary" block size="large" @click="proceedToExerciseSelection" rounded="lg" :disabled="!userNameCreate">Next: Select Exercise</v-btn></v-card></v-col><v-col cols="12" md="6"><v-card class="pa-6 rounded-lg bg-background"><v-card-title class="text-h6 mb-4">2. Join an Existing Session</v-card-title><v-text-field v-model="userNameJoin" label="Your Name" variant="outlined" class="mb-4" hide-details></v-text-field><v-text-field v-model="sessionIdInput" label="Session ID" variant="outlined" class="mb-4" hide-details></v-text-field><v-btn color="secondary" block size="large" @click="joinSession" rounded="lg" :disabled="!sessionIdInput || !userNameJoin">Join Session</v-btn></v-card></v-col></v-row></v-card-text></v-card><v-card elevation="12" class="pa-6 rounded-xl bg-surface"><v-row align="center"><v-col><v-card-title class="text-h6 text-primary">Explore Exercises</v-card-title><p class="text-subtitle2 text-on-surface">Browse our complete exercise library and learn proper form</p></v-col><v-col cols="auto"><v-btn color="info" size="large" @click="screen = 'exercise-details'" rounded="lg"><v-icon start>mdi-book-open-variant</v-icon>View Exercises</v-btn></v-col></v-row></v-card></v-col></v-row>
          </v-container>
        </div>

        <div v-else-if="screen === 'exercise-details'">
          <ExerciseDetails 
            :exercises="exercises" 
            @back="screen = 'home'" 
            @start-training="prepareAndStartTraining" 
            v-model:is-dark="darkMode" 
          />
        </div>

        <div v-else-if="screen === 'training'">
          <v-container class="py-10">
            <v-row justify="center"><v-col cols="12" lg="10"><v-card elevation="12" class="pa-6 rounded-xl bg-surface"><v-card-title class="text-h4 font-weight-bold text-center mb-4 text-primary">{{ currentExerciseName }} Training</v-card-title><v-row><v-col cols="12" md="4"><v-card class="pa-4 rounded-xl bg-background"><v-card-title class="text-h6 mb-2">Tu Cámara</v-card-title><div style="position: relative; width: 100%; aspect-ratio: 4 / 3;"><video ref="videoElement" autoplay playsinline muted style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover; transform: scaleX(-1);"></video><canvas ref="canvasElement" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scaleX(-1);"></canvas></div></v-card></v-col><v-col cols="12" md="4"><v-card class="pa-4 rounded-xl bg-background" style="height: 100%;"><v-card-title class="text-h6 mb-2">Video y Esqueleto de Referencia</v-card-title><div v-if="currentYoutubeId" style="position: relative; width: 100%; padding-top: 75%;"><div :id="'youtube-player-' + uniqueId" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.3;"></div><canvas ref="referenceCanvasElement" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 8px;"></canvas></div><div v-else class="d-flex fill-height justify-center align-center text-center text-medium-emphasis"><p>No hay referencia para este ejercicio.</p></div></v-card></v-col><v-col cols="12" md="4"><v-card elevation="4" class="mb-4 rounded-xl bg-surface"><v-card-title class="text-h6 text-primary">Live Leaderboard</v-card-title><v-card-text><v-list lines="one" class="bg-surface"><v-list-item v-for="(entry, index) in sortedLeaderboard" :key="entry.id" class="mb-2 rounded-lg bg-background"><template v-slot:prepend><v-avatar :color="index === 0 ? 'secondary' : 'primary'" size="small">{{ index + 1 }}</v-avatar></template><v-list-item-title class="font-weight-bold">{{ entry.name }}</v-list-item-title><template v-slot:append><v-chip color="success" label size="small">{{ entry.reps }} reps</v-chip></template></v-list-item></v-list></v-card-text></v-card><v-card elevation="4" class="rounded-xl bg-surface"><v-card-title class="text-h6 text-primary">Session Details</v-card-title><v-card-text><p class="font-weight-bold">Session ID: <span class="font-weight-light">{{ sessionId }}</span></p><v-btn size="small" color="primary" class="mt-2" @click="copySessionId" rounded="lg" variant="outlined">Copy ID</v-btn></v-card-text></v-card></v-col></v-row><v-row class="mt-4"><v-col cols="6"><v-card class="pa-4 text-center rounded-lg bg-surface"><div class="text-h6">Your Reps</div><div class="text-h3 font-weight-bold text-primary">{{ repCount }}</div></v-card></v-col><v-col cols="6"><v-card class="pa-4 text-center rounded-lg bg-surface"><div class="text-h6">Form Quality</div><div class="text-h3 font-weight-bold" :class="qualityColor">{{ (currentQuality * 100).toFixed(0) }}%</div></v-card></v-col></v-row><v-alert v-if="feedback" type="info" class="mt-4" variant="tonal" density="compact">{{ feedback }}</v-alert><v-btn v-if="!sessionActive" color="success" block size="large" @click="startTraining" rounded="lg" class="mt-4">Start Training</v-btn><v-btn v-else color="error" block size="large" @click="endTraining" rounded="lg" class="mt-4">End Training & View Results</v-btn></v-card></v-col></v-row>
          </v-container>
        </div>

        <div v-else-if="screen === 'results'">
          <v-container class="py-10"><v-row justify="center"><v-col cols="12" md="10" lg="8"><v-card elevation="12" class="pa-8 rounded-xl bg-surface"><v-card-title class="text-h4 font-weight-bold text-center mb-6 text-primary">Session Results</v-card-title><v-card-text><v-row class="mb-6"><v-col cols="12" md="6"><v-card class="pa-6 text-center rounded-lg bg-background"><div class="text-h6 mb-2">Exercise</div><div class="text-h5 font-weight-bold text-secondary">{{ currentExerciseName }}</div></v-card></v-col><v-col cols="12" md="6"><v-card class="pa-6 text-center rounded-lg bg-background"><div class="text-h6 mb-2">Your Reps</div><div class="text-h5 font-weight-bold text-primary">{{ repCount }}</div></v-card></v-col></v-row><v-card class="pa-6 rounded-lg mb-6 bg-background"><v-card-title class="text-h6 mb-4">Final Leaderboard</v-card-title><v-list lines="one"><v-list-item v-for="(entry, index) in sortedLeaderboard" :key="entry.id" class="mb-2 rounded-lg bg-surface"><template v-slot:prepend><v-avatar :color="index === 0 ? 'secondary' : 'primary'" size="small">{{ index + 1 }}</v-avatar></template><v-list-item-title class="font-weight-bold">{{ entry.name }}</v-list-item-title><template v-slot:append><v-chip color="success" label size="small">{{ entry.reps }} reps</v-chip></template></v-list-item></v-list></v-card><v-btn color="primary" block size="large" @click="goHome" rounded="lg">Start New Session</v-btn></v-card-text></v-card></v-col></v-row></v-container>
        </div>

        <div v-else-if="screen === 'profile'">
          <v-container class="py-10">
            <v-row justify="center">
              <v-col cols="12" md="10" lg="8">
                <v-card elevation="12" class="pa-8 rounded-xl bg-surface">
                  <v-card-title class="d-flex align-center mb-6">
                    <v-btn icon="mdi-arrow-left" flat @click="goBack" class="mr-3"></v-btn>
                    <span class="text-h4 font-weight-bold text-primary">Perfil y Ajustes</span>
                  </v-card-title>
                  <v-card-text>
                    <h3 class="text-h6 mb-4">Tu Perfil</h3>
                    <v-list class="bg-transparent">
                      <v-list-item>
                        <template v-slot:prepend><v-avatar color="primary" size="large"><span class="white--text text-h5">{{ userInitials }}</span></v-avatar></template>
                        <v-list-item-title class="text-h6">{{ editableUser.fullName }}</v-list-item-title>
                        <v-list-item-subtitle>{{ editableUser.email }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                    <v-text-field
                      v-model="editableUser.fullName"
                      label="Cambiar nombre completo"
                      variant="outlined"
                      class="mt-4"
                      append-inner-icon="mdi-content-save"
                      @click:append-inner="updateUserName"
                      :loading="isUpdatingName"
                      :disabled="isUpdatingName"
                    ></v-text-field>
                    <v-divider class="my-8"></v-divider>
                    <h3 class="text-h6 mb-4">Ajustes Visuales</h3>
                    <v-switch
                      v-model="darkMode"
                      label="Modo OLED (Negro Puro)"
                      color="primary"
                      inset
                      hide-details
                    ></v-switch>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <div v-else-if="screen === 'statistics'">
          <v-container v-if="isLoadingStats" class="d-flex justify-center align-center" style="height: 100%;"><v-progress-circular indeterminate color="primary" size="64"></v-progress-circular></v-container>
          <v-container v-else-if="userStats.fullName" class="py-10"><v-row justify="center"><v-col cols="12" md="10" lg="8"><v-card elevation="12" class="pa-8 rounded-xl bg-surface"><v-card-title class="d-flex align-center mb-6"><v-btn icon="mdi-arrow-left" flat @click="goBack" class="mr-3"></v-btn><span class="text-h4 font-weight-bold text-primary">Estadísticas de {{ userStats.fullName }}</span></v-card-title><v-card-text><h3 class="text-h6 mb-4 text-primary">Resumen de Carrera</h3><v-row><v-col cols="12" sm="4"><v-card class="pa-4 text-center rounded-lg bg-background"><div class="text-h5 font-weight-bold">{{ userStats.lifetime.totalSessions }}</div><div class="text-subtitle-1">Sesiones Totales</div></v-card></v-col><v-col cols="12" sm="4"><v-card class="pa-4 text-center rounded-lg bg-background"><div class="text-h5 font-weight-bold">{{ userStats.lifetime.totalReps }}</div><div class="text-subtitle-1">Reps Totales</div></v-card></v-col><v-col cols="12" sm="4"><v-card class="pa-4 text-center rounded-lg bg-background"><div class="text-h5 font-weight-bold text-truncate">{{ userStats.lifetime.favoriteExercise }}</div><div class="text-subtitle-1">Ejercicio Favorito</div></v-card></v-col></v-row><v-divider class="my-8"></v-divider><h3 class="text-h6 mb-4 text-primary">Foco Muscular</h3><v-card class="pa-4 rounded-lg bg-background"><v-list v-if="userStats.muscleBreakdown && userStats.muscleBreakdown.length > 0" class="bg-transparent"><v-list-item v-for="muscle in userStats.muscleBreakdown" :key="muscle.muscleGroup" class="mb-2"><template v-slot:prepend><v-icon color="secondary">mdi-chart-bar</v-icon></template><v-list-item-title class="text-capitalize font-weight-bold">{{ muscle.muscleGroup }}</v-list-item-title><v-list-item-subtitle>{{ muscle.sessionCount }} sesiones / {{ muscle.totalRepsInGroup }} reps</v-list-item-subtitle><template v-slot:append><v-progress-linear :model-value="(muscle.sessionCount / (userStats.lifetime.totalSessions || 1)) * 100" color="primary" height="8" rounded style="min-width: 100px;"></v-progress-linear></template></v-list-item></v-list><div v-else class="text-center py-4 text-medium-emphasis">Aún no has completado ninguna sesión. ¡A entrenar!</div></v-card></v-card-text></v-card></v-col></v-row></v-container>
        </div>
      </v-main>
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { useTheme } from 'vuetify';
import LoginRegister from './components/LoginRegister.vue';
import ExerciseDetails from './components/ExerciseDetails.vue';
import { useWebSocket } from './composables/useWebSocket.js';
import { useExerciseAnalyzer } from './composables/useExerciseAnalyzer.js';
import { usePoseDetection } from './composables/usePoseDetection.js';
import { drawPose } from './utils/drawPose.js';
import fitToniLogo from './assets/logo.jpg';

const uniqueId = ref(Date.now());
let youtubePlayer = null;
let referenceAnimationId = null;

const referencePoseSequence = ref(null);
const isProcessingVideo = ref(false);
const currentYoutubeId = ref(null);
const isAuthenticated = ref(false);
const currentUser = ref(null);
const screen = ref('home');
const previousScreen = ref('home');
const theme = useTheme();
const darkMode = ref(false);
const sessionId = ref('');
const participantId = ref('');
const currentExerciseName = ref('');
const currentFullExercise = ref(null);
const sessionActive = ref(false);
const leaderboard = ref({});
const userNameCreate = ref('');
const userNameJoin = ref('');
const sessionIdInput = ref('');
const exercises = ref([]);
const repCount = ref(0);
const currentQuality = ref(0.5);
const feedback = ref('');
const videoElement = ref(null);
const canvasElement = ref(null);
const referenceCanvasElement = ref(null);
const userStats = ref({});
const isLoadingStats = ref(false);
const editableUser = reactive({ fullName: '', email: '' });
const isUpdatingName = ref(false);

const qualityColor = computed(() => {
  if (currentQuality.value >= 0.8) return 'text-success';
  if (currentQuality.value >= 0.5) return 'text-warning';
  return 'text-error';
});

const BACKEND_URL = 'ws://127.0.0.1:8080';
const API_URL = 'http://127.0.0.1:8080';
const EXERCISEDB_API_KEY = import.meta.env.VITE_EXERCISEDB_API_KEY;
const EXERCISEDB_API_HOST = 'exercisedb.p.rapidapi.com';

watch(darkMode, (isDark) => {
  theme.global.name.value = isDark ? 'dark' : 'light';
});

watch(screen, (newScreen) => {
    if (newScreen === 'profile' && currentUser.value) {
        editableUser.fullName = currentUser.value.fullName;
        editableUser.email = currentUser.value.email;
    }
    if (newScreen === 'training') {
      nextTick(() => {
        if (window.YT && window.YT.Player) { createYoutubePlayer(); } 
        else { window.onYouTubeIframeAPIReady = createYoutubePlayer; }
      });
    }
});

function checkAuthentication() {
  const user = localStorage.getItem('user');
  if (user) currentUser.value = JSON.parse(user);
  isAuthenticated.value = !!currentUser.value;
}
function logout() {
  localStorage.removeItem('user');
  isAuthenticated.value = false;
  window.location.reload();
}
const userInitials = computed(() => {
  if (!currentUser.value) return 'U';
  return currentUser.value.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});

const { wsConnected, send } = useWebSocket(BACKEND_URL, {
  leaderboard_update: (data) => leaderboard.value = { ...leaderboard.value, ...data.payload.leaderboard },
  session_info: (data) => {
    currentExerciseName.value = data.payload.exercise;
    leaderboard.value = { ...leaderboard.value, ...data.payload.leaderboard };
    if (data.payload.referenceData) {
      const { youtubeId, poseTemplate } = data.payload.referenceData;
      if (currentYoutubeId.value !== youtubeId) {
        currentYoutubeId.value = youtubeId;
        referencePoseSequence.value = poseTemplate;
      }
    }
  },
  reference_data_update: (data) => {
    const { youtubeId, poseTemplate } = data.payload;
    if (currentYoutubeId.value !== youtubeId) {
      currentYoutubeId.value = youtubeId;
      referencePoseSequence.value = poseTemplate;
      if(screen.value === 'training') {
          nextTick(createYoutubePlayer);
      }
    }
  },
  participant_left: (data) => {
    const { [data.payload.participantId]: _, ...newLeaderboard } = leaderboard.value;
    leaderboard.value = newLeaderboard;
  },
  error: (data) => {
    alert(`Error de WebSocket: ${data.payload.message}`);
    goHome();
  }
});

const { repCount: repCountAnalyzer, feedback: feedbackAnalyzer, analyzeExercise: analyzeReps, setRepCount } = useExerciseAnalyzer(
  currentExerciseName,
  (repData) => {
    send('rep_update', {
      sessionId: sessionId.value,
      participantId: participantId.value,
      payload: { reps: repCount.value, quality: currentQuality.value, feedback: repData.feedback }
    });
  }
);

onMounted(async () => {
  checkAuthentication();
  if (isAuthenticated.value) {
    await loadExercises();
  }
  const interval = setInterval(() => {
    repCount.value = repCountAnalyzer.value;
    feedback.value = feedbackAnalyzer.value;
  }, 100);
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  }
  return () => clearInterval(interval);
});

const { startPoseDetection, stopPoseDetection } = usePoseDetection(
  videoElement,
  canvasElement,
  (analysisData) => {
    if (analysisData.quality !== undefined) currentQuality.value = analysisData.quality;
    analyzeReps(analysisData.poses, analysisData.referencePose, analysisData.quality);
  },
  sessionActive,
  referencePoseSequence
);

const sortedLeaderboard = computed(() => Object.values(leaderboard.value).sort((a, b) => b.reps - a.reps));

async function prepareAndStartTraining(data) {
  const { exercise, userName, youtubeId } = data;
  participantId.value = 'user_' + Math.random().toString(36).substr(2, 9);
  currentYoutubeId.value = youtubeId;
  currentFullExercise.value = exercise;
  createSession(exercise.name, userName);
  if (!youtubeId) return;
  isProcessingVideo.value = true;
  referencePoseSequence.value = null;
  try {
    const response = await fetch(`${API_URL}/api/process-youtube-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeId })
    });
    if (!response.ok) throw new Error((await response.json()).error);
    const result = await response.json();
    referencePoseSequence.value = result.poseTemplate;
    send('share_reference_data', { sessionId: sessionId.value, payload: { youtubeId, poseTemplate: result.poseTemplate } });
  } catch (err) {
    alert(`Error al procesar el video: ${err.message}`);
  } finally {
    isProcessingVideo.value = false;
  }
}

function createYoutubePlayer() {
  if (!currentYoutubeId.value) return;
  if (youtubePlayer) youtubePlayer.destroy();
  youtubePlayer = new window.YT.Player(`youtube-player-${uniqueId.value}`, {
    height: '100%', width: '100%', videoId: currentYoutubeId.value,
    playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: currentYoutubeId.value, mute: 1, playsinline: 1 },
    events: { 'onReady': onPlayerReady }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
  startReferenceSkeletonPlayer();
}

function startReferenceSkeletonPlayer() {
  if (!referencePoseSequence.value || !referenceCanvasElement.value || !youtubePlayer) return;
  const sequence = referencePoseSequence.value.keypoints_sequence;
  const canvas = referenceCanvasElement.value;
  const ctx = canvas.getContext('2d');
  const templateFPS = 15;
  const animate = () => {
    if (screen.value !== 'training' || !sessionActive.value) { cancelAnimationFrame(referenceAnimationId); return; }
    const currentTime = youtubePlayer.getCurrentTime ? youtubePlayer.getCurrentTime() : 0;
    const frameIndex = Math.floor(currentTime * templateFPS) % sequence.length;
    if (canvas.width !== canvas.clientWidth) { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; }
    if (sequence[frameIndex]) {
      const pose = { keypoints: sequence[frameIndex] };
      const scaledPose = { keypoints: pose.keypoints.map(kp => ({ ...kp,
          x: kp.x * (canvas.width / (referencePoseSequence.value.video_width || 640)),
          y: kp.y * (canvas.height / (referencePoseSequence.value.video_height || 480)),
        }))
      };
      drawPose(scaledPose, ctx);
    }
    referenceAnimationId = requestAnimationFrame(animate);
  };
  animate();
}

function stopReferenceSkeletonPlayer() {
  if (referenceAnimationId) cancelAnimationFrame(referenceAnimationId);
  if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
    youtubePlayer.destroy();
    youtubePlayer = null;
  }
}

async function loadUserStats() {
  if (!currentUser.value || !currentUser.value.id) return;
  isLoadingStats.value = true;
  try {
    const response = await fetch(`${API_URL}/api/users/${currentUser.value.id}/stats`);
    if (!response.ok) throw new Error('No se pudieron cargar las estadísticas.');
    userStats.value = await response.json();
  } catch (error) {
    alert(error.message);
  } finally {
    isLoadingStats.value = false;
  }
}

function navigateTo(page) {
  if (screen.value !== page) {
    previousScreen.value = screen.value;
    screen.value = page;
    if (page === 'statistics') {
      loadUserStats();
    }
  }
}
function goBack() { screen.value = previousScreen.value; }
function proceedToExerciseSelection() {
  userNameCreate.value = currentUser.value.fullName;
  screen.value = 'exercise-details';
}

function createSession(exerciseName, userName) {
  userNameCreate.value = userName;
  sessionId.value = 'session_' + Math.random().toString(36).substr(2, 9);
  setRepCount(0);
  currentExerciseName.value = exerciseName || 'Unknown';
  leaderboard.value = { [participantId.value]: { id: participantId.value, name: userNameCreate.value, reps: 0 } };
  send('join', { sessionId: sessionId.value, participantId: participantId.value, payload: { name: userNameCreate.value, exercise: currentExerciseName.value } });
  screen.value = 'training';
}

function joinSession() {
  sessionId.value = sessionIdInput.value;
  participantId.value = 'user_' + Math.random().toString(36).substr(2, 9);
  userNameJoin.value = currentUser.value.fullName;
  setRepCount(0);
  leaderboard.value = { [participantId.value]: { id: participantId.value, name: userNameJoin.value, reps: 0 } };
  send('join', { sessionId: sessionId.value, participantId: participantId.value, payload: { name: userNameJoin.value, exercise: '' } });
  screen.value = 'training';
}

function startTraining() {
  sessionActive.value = true;
  startPoseDetection();
  if (youtubePlayer && typeof youtubePlayer.playVideo === 'function') {
    youtubePlayer.playVideo();
    startReferenceSkeletonPlayer();
  }
}

function endTraining() {
  sessionActive.value = false;
  stopPoseDetection();
  stopReferenceSkeletonPlayer();
  const fullExerciseObject = exercises.value.find(ex => ex.name === currentExerciseName.value);
  send('session_end', { 
    sessionId: sessionId.value, 
    participantId: participantId.value, 
    payload: { exercise: fullExerciseObject || { name: currentExerciseName.value } } 
  });
  screen.value = 'results';
}

async function updateUserName() {
  if (!currentUser.value || !editableUser.fullName || editableUser.fullName === currentUser.value.fullName) return;
  isUpdatingName.value = true;
  try {
    const response = await fetch(`${API_URL}/api/users/${currentUser.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: editableUser.fullName })
    });
    if (!response.ok) throw new Error((await response.json()).error || 'No se pudo actualizar el nombre.');
    const updatedUser = { ...currentUser.value, fullName: editableUser.fullName };
    currentUser.value = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
    alert('¡Nombre actualizado con éxito!');
  } catch (error) {
    alert(error.message);
    editableUser.fullName = currentUser.value.fullName;
  } finally {
    isUpdatingName.value = false;
  }
}

function goHome() {
  screen.value = 'home';
  previousScreen.value = 'home';
  sessionId.value = '';
  participantId.value = '';
  currentExerciseName.value = '';
  currentFullExercise.value = null;
  sessionActive.value = false;
  leaderboard.value = {};
  setRepCount(0);
  repCount.value = 0;
  currentYoutubeId.value = null;
  stopPoseDetection();
  stopReferenceSkeletonPlayer();
}

function copySessionId() {
  navigator.clipboard.writeText(sessionId.value);
  alert('Session ID copiado al portapapeles!');
}

async function loadExercises() {
  try {
    const response = await fetch(`https://${EXERCISEDB_API_HOST}/exercises?limit=1300`, {
      method: 'GET',
      headers: { 'X-RapidAPI-Key': EXERCISEDB_API_KEY, 'X-RapidAPI-Host': EXERCISEDB_API_HOST }
    });
    if (!response.ok) throw new Error('Failed to fetch exercises from external API');
    exercises.value = await response.json();
  } catch (err) {
    console.error('Error loading exercises:', err);
    alert('No se pudieron cargar los ejercicios.');
  }
}

onUnmounted(() => {
  stopPoseDetection();
  stopReferenceSkeletonPlayer();
});
</script>

<style scoped>
.break-word { word-break: break-all; }
</style>