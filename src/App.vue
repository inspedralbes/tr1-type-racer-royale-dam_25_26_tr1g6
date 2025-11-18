<template>
  <v-app>
    <!-- Show login page if user is not authenticated -->
    <GoogleLogin v-if="!isAuthenticated" />

    <!-- Show main app if user is authenticated -->
    <div v-else>
      <!-- 1. App Bar (Header) -->
      <v-app-bar color="surface" flat app border>
        <v-container class="d-flex align-center py-0">
          <v-img
            src="https://cdn-icons-png.flaticon.com/512/3032/3032700.png"
            max-height="40"
            max-width="40"
            class="mr-3"
            alt="Gym Logo"
          ></v-img>
          <v-toolbar-title class="font-weight-bold text-h5 text-primary">
            Fit<span class="text-secondary">Toni</span>
          </v-toolbar-title>
          <v-spacer></v-spacer>

          <!-- User Info and Logout -->
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon v-bind="props" size="small">
                <v-avatar color="primary" size="32">
                  {{ userInitials }}
                </v-avatar>
              </v-btn>
            </template>
            <v-list>
              <v-list-item>
                <v-list-item-title class="font-weight-bold text-primary">
                  {{ currentUser?.fullName }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ currentUser?.email }}
                </v-list-item-subtitle>
              </v-list-item>
              <v-divider class="my-2"></v-divider>
              <v-list-item title="Logout" @click="logout"></v-list-item>
            </v-list>
          </v-menu>


          <!-- Connection Status Chip -->
          <v-chip v-if="wsConnected" color="success" label size="small" class="ml-3">
            <v-icon start size="x-small">mdi-wifi</v-icon>
            Connected
          </v-chip>
          <v-chip v-else color="error" label size="small" class="ml-3">
            <v-icon start size="x-small">mdi-wifi-off</v-icon>
            Offline
          </v-chip>
        </v-container>
      </v-app-bar>

      <!-- 2. Main Content Area -->
      <v-main class="bg-background">
        <!-- Home Screen: Session Setup -->
        <div v-if="screen === 'home'">
          <v-container class="py-10">
            <v-row justify="center">
              <v-col cols="12" md="10" lg="8">
                <v-card elevation="12" class="pa-8 rounded-xl bg-surface mb-6">
                  <v-card-title class="text-h4 font-weight-bold text-center mb-6 text-primary">
                    Start Your Virtual Training Session
                  </v-card-title>
                  <v-card-text>
                    <v-row>
                      <!-- Create Session -->
                      <v-col cols="12" md="6">
                        <v-card class="pa-6 rounded-lg bg-background">
                          <v-card-title class="text-h6 mb-4">1. Create a New Session</v-card-title>

                          <v-card-text class="text-subtitle-1 mb-4">
                            <v-text-field v-model="userNameCreate" label="Your Name" variant="outlined" class="mb-4" ></v-text-field>
                          </v-card-text>

                          <v-btn
                            color="primary"
                            block
                            size="large"
                            @click="proceedToExerciseSelection"
                            rounded="lg"
                            :disabled="!userNameCreate"
                          >
                            Next: Select Exercise
                          </v-btn>
                        </v-card>
                      </v-col>


                      <!-- Join Session -->
                      <v-col cols="12" md="6">
                        <v-card class="pa-6 rounded-lg bg-background">
                          <v-card-title class="text-h6 mb-4">2. Join an Existing Session</v-card-title>
                            <v-text-field
                              v-model="userNameJoin"
                              label="Your Name"
                              variant="outlined"
                              class="mb-4"
                              hide-details
                            ></v-text-field>
                          <v-text-field
                            v-model="sessionIdInput"
                            label="Session ID"
                            variant="outlined"
                            class="mb-4"
                            hide-details
                          ></v-text-field>
                          <v-btn
                            color="secondary"
                            block
                            size="large"
                            @click="joinSession"
                            rounded="lg"
                            :disabled="!sessionIdInput || !userNameJoin"
                          >
                            Join Session
                          </v-btn>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>

                <!-- Browse Exercises Button -->
                <v-card elevation="12" class="pa-6 rounded-xl bg-surface">
                  <v-row align="center">
                    <v-col>
                      <v-card-title class="text-h6 text-primary">
                        Explore Exercises
                      </v-card-title>
                      <p class="text-subtitle2 text-on-surface">
                        Browse our complete exercise library and learn proper form
                      </p>
                    </v-col>
                    <v-col cols="auto">
                      <v-btn
                        color="info"
                        size="large"
                        @click="screen = 'exercise-details'"
                        rounded="lg"
                      >
                        <v-icon start>mdi-book-open-variant</v-icon>
                        View Exercises
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- Exercise Details Screen -->
        <div v-else-if="screen === 'exercise-details'">
          <ExerciseDetails
            @back="screen = 'home'"
            @start-training="handleStartTrainingFromExercises"
          />
        </div>

        <!-- Training Screen -->
        <div v-else-if="screen === 'training'">
          <v-container class="py-10">
            <v-row justify="center">
              <v-col cols="12" md="10" lg="8">
                <v-card elevation="12" class="pa-6 rounded-xl bg-surface">
                  <v-card-title class="text-h4 font-weight-bold text-center mb-4 text-primary">
                    {{ currentExerciseName }} Training
                  </v-card-title>
                  <v-row>
                    <!-- Camera Feed and Controls -->
                    <v-col cols="12" lg="8">
                      <v-card class="pa-4 rounded-xl bg-background">
                        <div style="position: relative; width: 100%; max-width: 800px; margin: 0 auto;">
                          <video
                            ref="videoElement"
                            autoplay
                            playsinline
                            style="width: 100%; border-radius: 8px; display: block;"
                          ></video>
                          <canvas
                            ref="canvasElement"
                            style="position: absolute; top: 0; left: 0; width: 100%; border-radius: 8px;"
                          ></canvas>
                        </div>

                        <v-row class="mt-4">
                          <v-col cols="6">
                            <v-card class="pa-4 text-center rounded-lg bg-surface">
                              <div class="text-h6">Your Reps</div>
                              <div class="text-h3 font-weight-bold text-primary">{{ repCount }}</div>
                            </v-card>
                          </v-col>
                          <v-col cols="6">
                            <v-card class="pa-4 text-center rounded-lg bg-surface">
                              <div class="text-h6">Form Quality</div>
                              <div class="text-h3 font-weight-bold" :class="qualityColor">
                                {{ (currentQuality * 100).toFixed(0) }}%
                              </div>
                            </v-card>
                          </v-col>
                        </v-row>

                        <v-alert v-if="feedback" type="success" class="mt-4" variant="tonal">
                          {{ feedback }}
                        </v-alert>

                        <v-btn
                          v-if="!sessionActive"
                          color="success"
                          block
                          size="large"
                          @click="startTraining"
                          rounded="lg"
                          class="mt-4"
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
                          class="mt-4"
                        >
                          End Training & View Results
                        </v-btn>
                      </v-card>
                    </v-col>

                    <!-- Leaderboard and Session Info -->
                    <v-col cols="12" lg="4">
                      <v-card elevation="4" class="mb-4 rounded-xl bg-surface">
                        <v-card-title class="text-h6 text-primary">Live Leaderboard</v-card-title>
                        <v-card-text>
                          <v-list lines="one" class="bg-surface">
                            <v-list-item
                              v-for="(entry, index) in sortedLeaderboard"
                              :key="entry.id"
                              class="mb-2 rounded-lg bg-background"
                            >
                              <template v-slot:prepend>
                                <v-avatar :color="index === 0 ? 'secondary' : 'primary'" size="small">{{ index + 1 }}</v-avatar>
                              </template>
                              <v-list-item-title class="font-weight-bold">{{ entry.name }}</v-list-item-title>
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

                      <v-card elevation="4" class="rounded-xl bg-surface">
                        <v-card-title class="text-h6 text-primary">Session Details</v-card-title>
                        <v-card-text>
                          <p class="font-weight-bold">Session ID:</p>
                          <p class="text-caption break-word font-weight-light">{{ sessionId }}</p>
                          <v-btn
                            size="small"
                            color="primary"
                            class="mt-2"
                            @click="copySessionId"
                            rounded="lg"
                            variant="outlined"
                          >
                            Copy ID
                          </v-btn>
                          <p class="mt-4 font-weight-bold">Exercise: <span class="text-secondary">{{ currentExerciseName }}</span></p>
                          <p class="font-weight-bold">Status: <span :class="sessionActive ? 'text-success' : 'text-warning'">{{ sessionActive ? 'Active' : 'Waiting' }}</span></p>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- Results Screen -->
        <div v-else-if="screen === 'results'">
          <v-container class="py-10">
            <v-row justify="center">
              <v-col cols="12" md="10" lg="8">
                <v-card elevation="12" class="pa-8 rounded-xl bg-surface">
                  <v-card-title class="text-h4 font-weight-bold text-center mb-6 text-primary">
                    Session Results
                  </v-card-title>
                  <v-card-text>
                    <v-row class="mb-6">
                      <v-col cols="12" md="6">
                        <v-card class="pa-6 text-center rounded-lg bg-background">
                          <div class="text-h6 mb-2">Exercise</div>
                          <div class="text-h5 font-weight-bold text-secondary">{{ currentExerciseName }}</div>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-card class="pa-6 text-center rounded-lg bg-background">
                          <div class="text-h6 mb-2">Your Reps</div>
                          <div class="text-h5 font-weight-bold text-primary">{{ repCount }}</div>
                        </v-card>
                      </v-col>
                    </v-row>

                    <v-card class="pa-6 rounded-lg mb-6 bg-background">
                      <v-card-title class="text-h6 mb-4">Final Leaderboard</v-card-title>
                      <v-list lines="one">
                        <v-list-item
                          v-for="(entry, index) in sortedLeaderboard"
                          :key="entry.id"
                          class="mb-2 rounded-lg bg-surface"
                        >
                          <template v-slot:prepend>
                            <v-avatar :color="index === 0 ? 'secondary' : 'primary'" size="small">{{ index + 1 }}</v-avatar>
                          </template>
                          <v-list-item-title class="font-weight-bold">{{ entry.name }}</v-list-item-title>
                          <template v-slot:append>
                            <v-chip color="success" label size="small">{{ entry.reps }} reps</v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                    </v-card>

                    <v-btn
                      color="primary"
                      block
                      size="large"
                      @click="goHome"
                      rounded="lg"
                    >
                      Start New Session
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-main>
    </div>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import GoogleLogin from './components/GoogleLogin.vue'
import ExerciseDetails from './components/ExerciseDetails.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useExerciseAnalyzer } from './composables/useExerciseAnalyzer'
import { usePoseDetection } from './composables/usePoseDetection'

// =================================================================================
// 1. STATE MANAGEMENT
// =================================================================================

// Authentication
const isAuthenticated = ref(false)
const currentUser = ref(null)

// Screen Navigation
const screen = ref('home')

// Session Management
const sessionId = ref('')
const participantId = ref('')
const currentExerciseName = ref('')
const sessionActive = ref(false)
const leaderboard = ref({})
	const participants = ref([]) 

// Exercise Management
const exercises = ref([])
const selectedExerciseId = ref(null)
const userNameCreate = ref('')
const userNameJoin = ref('')
const sessionIdInput = ref('')
const tempUserNameForExerciseSelection = ref('')

// UI State
const loading = ref(false)
const loadingType = ref('initial')
const loadingMessage = ref('')
const filteredExercises = ref([])
const search = ref('')

// Exercise Analysis
const repCount = ref(0)
const currentQuality = ref(0.5)
const feedback = ref('')
const qualityColor = computed(() => {
  if (currentQuality.value >= 0.8) return 'text-success'
  if (currentQuality.value >= 0.5) return 'text-warning'
  return 'text-error'
})

// DOM Element Refs
const videoElement = ref(null)
const canvasElement = ref(null)

// Environment Variables
const BACKEND_URL = 'ws://127.0.0.1:8080'
const API_URL = 'http://127.0.0.1:8080'

// =================================================================================
// 2. CHECK AUTHENTICATION
// =================================================================================

function checkAuthentication() {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      currentUser.value = JSON.parse(user)
      isAuthenticated.value = true
    } catch (err) {
      console.error('Error parsing user data:', err)
      isAuthenticated.value = false
    }
  } else {
    isAuthenticated.value = false
  }
}

function logout() {
  localStorage.removeItem('user')
  currentUser.value = null
  isAuthenticated.value = false
  window.location.reload()
}

const userInitials = computed(() => {
  if (!currentUser.value) return 'U'
  const names = currentUser.value.fullName.split(' ')
  return names.map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// =================================================================================
// 3. COMPOSABLES (Reusable Logic)
// =================================================================================

// WebSocket Logic
	const { ws, wsConnected, send } = useWebSocket(BACKEND_URL, {
	  // Handles initial state when joining a session
	  session_state: (data) => {
	    currentExerciseName.value = data.exercise
	    // The leaderboard contains all participants' initial rep counts
	    const newLeaderboard = {}
	    data.leaderboard.forEach(p => {
	      newLeaderboard[p.id] = { id: p.id, name: p.name, reps: p.reps }
	    })
	    leaderboard.value = newLeaderboard
	  },
	  // Handles when a new participant joins or an existing one leaves
	  participant_joined: (data) => {
	    // Update the leaderboard structure to include the new participant with 0 reps if not present
	    const newLeaderboard = { ...leaderboard.value }
	    data.participants.forEach(p => {
	      if (!newLeaderboard[p.id]) {
	        newLeaderboard[p.id] = { id: p.id, name: p.name, reps: 0 }
	      }
	    })
	    leaderboard.value = newLeaderboard
	  },
	  participant_left: (data) => {
	    // Remove the participant from the leaderboard
	    const newLeaderboard = { ...leaderboard.value }
	    delete newLeaderboard[data.participantId]
	    leaderboard.value = newLeaderboard
	  },
	  // Handles repetition updates from any participant
	  repetition_update: (data) => {
	    if (leaderboard.value[data.participantId]) {
	      leaderboard.value[data.participantId].reps = data.reps
	    }
	    // If the update is for the current user, update local state
	    if (data.participantId === participantId.value) {
	      repCount.value = data.reps
	      currentQuality.value = data.quality
	      feedback.value = data.feedback
	    }
	  },
	  session_ended: (data) => {
	    // Handle session end if necessary, though current logic moves to results screen
	    console.log('Session ended by host:', data.results)
	  },
	  error: (data) => {
	    console.error('WS Error:', data.message)
	    alert(`Error: ${data.message}`)
	    goHome()
	  }
	})

// Exercise Analysis Logic
	const { repCount: repCountAnalyzer, currentQuality: qualityAnalyzer, feedback: feedbackAnalyzer, analyzeExercise, setRepCount } = useExerciseAnalyzer(
	  currentExerciseName,
	  (repData) => {
	    // The repCount is updated by the analyzer, so we use the analyzer's value here
	    send('repetition', { // Changed 'rep_update' to 'repetition' to match backend
	      sessionId: sessionId.value,
	      participantId: participantId.value,
	      payload: {
	        reps: repCountAnalyzer.value, // Use analyzer's rep count
	        quality: repData.quality,
	        feedback: repData.feedback
	      }
	    })
	  }
	)

// Sync analyzer values
	// The repetition_update handler now updates repCount, currentQuality, and feedback for the current user.
	// We only need to sync the analyzer's values to the local state when the analyzer updates them.
	// The repetition_update handler will ensure that the local state is also updated when the server confirms the update.
	onMounted(() => {
	  const interval = setInterval(() => {
	    // Only update if the analyzer has a new value, to avoid overwriting server-pushed values
	    if (repCount.value !== repCountAnalyzer.value) {
	      repCount.value = repCountAnalyzer.value
	    }
	    if (currentQuality.value !== qualityAnalyzer.value) {
	      currentQuality.value = qualityAnalyzer.value
	    }
	    if (feedback.value !== feedbackAnalyzer.value) {
	      feedback.value = feedbackAnalyzer.value
	    }
	  }, 100)
	  return () => clearInterval(interval)
	})

// Pose Detection Logic
const { startPoseDetection, stopPoseDetection } = usePoseDetection(
  videoElement,
  canvasElement,
  analyzeExercise,
  sessionActive
)

// =================================================================================
// 4. COMPUTED PROPERTIES
// =================================================================================

const exerciseOptions = computed(() => {
  return exercises.value.filter(e => e.name && e.id)
})

const sortedLeaderboard = computed(() => {
	  // leaderboard.value is an object { participantId: { id, name, reps } }
	  return Object.values(leaderboard.value)
	    .sort((a, b) => b.reps - a.reps)
	    .map((entry, index) => ({
	      ...entry,
	      rank: index + 1
	    }))
	})

// =================================================================================
// 5. FUNCTIONS (Actions)
// =================================================================================

// Proceed to exercise selection
function proceedToExerciseSelection() {
  tempUserNameForExerciseSelection.value = userNameCreate.value
  screen.value = 'exercise-details'
}

// Handle start training from exercise details
function handleStartTrainingFromExercises(data) {
  selectedExerciseId.value = data.exercise.id
  userNameCreate.value = data.userName
  createSession()
}

// Create a new training session
function createSession() {
  sessionId.value = 'session_' + Math.random().toString(36).substr(2, 9)
  participantId.value = 'user_' + Math.random().toString(36).substr(2, 9)

  leaderboard.value = {}
  setRepCount(0)

  const exercise = exercises.value.find(e => e.id === selectedExerciseId.value)
  currentExerciseName.value = exercise ? exercise.name : 'Unknown'

  send('join', {
    sessionId: sessionId.value,
    participantId: participantId.value,
    payload: {
      name: userNameCreate.value,
      exercise: currentExerciseName.value
    }
  })

  screen.value = 'training'
}

// Join an existing training session
function joinSession() {
  sessionId.value = sessionIdInput.value
  participantId.value = 'user_' + Math.random().toString(36).substr(2, 9)

  leaderboard.value = {}
  setRepCount(0)

  send('join', {
    sessionId: sessionId.value,
    participantId: participantId.value,
    payload: {
      name: userNameJoin.value,
      exercise: ''
    }
  })

  screen.value = 'training'
}

// Start the pose detection and rep counting
function startTraining() {
  sessionActive.value = true
  startPoseDetection()
}

// End the training session
function endTraining() {
  sessionActive.value = false
  stopPoseDetection()

  send('session_end', {
    sessionId: sessionId.value,
    participantId: participantId.value
  })

  screen.value = 'results'
}

// Go back to the home screen
function goHome() {
  screen.value = 'home'
  selectedExerciseId.value = null
  userNameCreate.value = ''
  sessionIdInput.value = ''
  userNameJoin.value = ''
  sessionId.value = ''
  participantId.value = ''
  currentExerciseName.value = ''
  sessionActive.value = false
  leaderboard.value = {}
  setRepCount(0)
  stopPoseDetection()
}

// Copy session ID to clipboard
function copySessionId() {
  navigator.clipboard.writeText(sessionId.value)
}

// Load initial list of exercises from the backend
async function loadExercises() {
  loading.value = true
  loadingType.value = 'initial'
  loadingMessage.value = 'Fetching exercise list...'
  try {
    const response = await fetch(`${API_URL}/api/exercises`)
    if (!response.ok) throw new Error('Failed to fetch exercises')
    const data = await response.json()
    exercises.value = data
    filteredExercises.value = data.slice(0, 12)
  } catch (err) {
    console.error('Error loading exercises:', err)
    alert('Could not load exercises. Check if the backend server is running.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  checkAuthentication()
  if (isAuthenticated.value) {
    await loadExercises()
     // Pre-fill the session creation and joining names with the logged-in user's name
    const fullName = currentUser.value?.fullName || ''
    userNameCreate.value = fullName
    userNameJoin.value = fullName
  }
});

onUnmounted(() => {
  stopPoseDetection()
})
</script>

<style scoped>
.break-word {
  word-break: break-all;
}

.exercise-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.exercise-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2) !important;
}

.card-image-container {
  position: relative;
  overflow: hidden;
}

.card-image {
  filter: brightness(0.8);
  transition: filter 0.3s ease;
}

.exercise-card:hover .card-image {
  filter: brightness(1.0);
}
</style>
