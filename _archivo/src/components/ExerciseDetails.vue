<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="10">
        <!-- Header -->
        <v-card elevation="12" class="pa-8 rounded-xl bg-surface mb-6">
          <v-row align="center">
            <v-col>
              <v-card-title class="text-h4 font-weight-bold text-primary">
                Exercise Library
              </v-card-title>
              <p class="text-subtitle1 text-on-surface">Browse and learn about all available exercises</p>
            </v-col>
            <v-col cols="auto">
              <v-btn
                color="primary"
                @click="goBack"
                rounded="lg"
                variant="outlined"
              >
                <v-icon start>mdi-arrow-left</v-icon>
                Back to Home
              </v-btn>
            </v-col>
          </v-row>
        </v-card>

        <!-- Search and Filter -->
        <v-card elevation="12" class="pa-6 rounded-xl bg-surface mb-6">
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="searchQuery"
                label="Search exercises..."
                variant="outlined"
                prepend-inner-icon="mdi-magnify"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedDifficulty"
                :items="['All', 'Beginner', 'Intermediate', 'Advanced']"
                label="Filter by Difficulty"
                variant="outlined"
                hide-details
              ></v-select>
            </v-col>
          </v-row>
        </v-card>

        <!-- Exercises Grid -->
        <v-row>
          <v-col
            v-for="exercise in filteredExercises"
            :key="exercise.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card
              elevation="8"
              class="rounded-xl bg-surface h-100 exercise-card"
              @click="selectExercise(exercise)"
            >
              <v-card-item class="pb-0">
                <v-card-title class="text-h6 text-primary">
                  {{ exercise.name }}
                </v-card-title>
                <v-card-subtitle class="text-on-surface">
                  {{ exercise.difficulty }}
                </v-card-subtitle>
              </v-card-item>

              <v-card-text>
                <p class="text-sm mb-4">{{ exercise.description }}</p>

                <div class="mb-4">
                  <p class="text-caption font-weight-bold text-secondary mb-2">Target Muscles:</p>
                  <div class="d-flex flex-wrap gap-2">
                    <v-chip
                      v-for="muscle in exercise.targetMuscles"
                      :key="muscle"
                      size="small"
                      color="primary"
                      variant="outlined"
                    >
                      {{ muscle }}
                    </v-chip>
                  </div>
                </div>

                <v-divider class="my-4"></v-divider>

                <p class="text-caption font-weight-bold text-secondary mb-2">Instructions:</p>
                <p class="text-sm">{{ exercise.instructions }}</p>
              </v-card-text>

              <v-card-actions>
                <v-btn
                  color="primary"
                  block
                  size="small"
                  @click.stop="selectExercise(exercise)"
                  rounded="lg"
                >
                  <v-icon start>mdi-dumbbell</v-icon>
                  Start Training
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- No Results -->
        <v-row v-if="filteredExercises.length === 0" justify="center" class="mt-10">
          <v-col cols="12" md="6" class="text-center">
            <v-card elevation="0" class="pa-8 bg-background">
              <v-icon size="64" color="primary" class="mb-4">mdi-magnify-close</v-icon>
              <p class="text-h6 text-on-surface">No exercises found</p>
              <p class="text-caption text-on-surface">Try adjusting your search or filters</p>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Exercise Selection Dialog -->
    <v-dialog v-model="showSelectionDialog" max-width="500px">
      <v-card class="bg-surface">
        <v-card-title class="text-h6 text-primary">
          Start Training Session
        </v-card-title>
        <v-card-text class="py-6">
          <p class="mb-4">
            You selected: <strong class="text-secondary">{{ selectedExerciseForTraining?.name }}</strong>
          </p>
          <v-text-field 
            v-model="trainingUserName" 
            label="User" 
            variant="outlined" 
            class="mb-4">
          </v-text-field>

          <p class="text-caption text-on-surface">
            You can start a new training session or join an existing one.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="secondary"
            variant="text"
            @click="showSelectionDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="startNewSession"
            :disabled="!trainingUserName"
          >
            Start New Session
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props and Emits
const emit = defineEmits(['back', 'start-training'])

// State
const exercises = ref([])
const searchQuery = ref('')
const selectedDifficulty = ref('All')
const showSelectionDialog = ref(false)
const selectedExerciseForTraining = ref(null)
const trainingUserName = ref('')

// API URL
const API_URL = 'http://127.0.0.1:8080'

// Computed
const filteredExercises = computed(() => {
  return exercises.value.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         exercise.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesDifficulty = selectedDifficulty.value === 'All' || exercise.difficulty === selectedDifficulty.value
    return matchesSearch && matchesDifficulty
  })
})

// Methods
function goBack() {
  emit('back')
}

function selectExercise(exercise) {
  selectedExerciseForTraining.value = exercise
  trainingUserName.value = ''
  showSelectionDialog.value = true
}

function startNewSession() {
  emit('start-training', {
    exercise: selectedExerciseForTraining.value,
    userName: trainingUserName.value
  })
  showSelectionDialog.value = false
}

async function loadExercises() {
  try {
    const response = await fetch(`${API_URL}/api/exercises`)
    if (!response.ok) throw new Error('Failed to fetch exercises')
    exercises.value = await response.json()
  } catch (err) {
    console.error('Error loading exercises:', err)
    alert('Could not load exercises. Make sure the backend is running.')
  }
}

// Lifecycle
onMounted(() => {
  loadExercises()
})
</script>

<style scoped>
.exercise-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.exercise-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(74, 158, 255, 0.3) !important;
}

.gap-2 {
  gap: 0.5rem;
}
</style>
