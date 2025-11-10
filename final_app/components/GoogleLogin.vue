<template>
  <v-app>
    <v-main class="bg-background">
      <v-container class="d-flex align-center justify-center" style="min-height: 100vh;">
        <v-card elevation="12" class="pa-8 rounded-xl bg-surface" style="max-width: 500px; width: 100%;">
          <!-- Logo and Title -->
          <div class="text-center mb-8">
            <v-img
              src="https://cdn-icons-png.flaticon.com/512/3032/3032700.png"
              max-height="60"
              max-width="60"
              class="mx-auto mb-4"
              alt="Gym Logo"
            ></v-img>
            <h1 class="text-h4 font-weight-bold text-primary mb-2">FitToni</h1>
            <p class="text-subtitle1 text-on-surface">Virtual Training Platform</p>
          </div>

          <!-- Login Form -->
          <v-card-text>
            <v-form @submit.prevent="handleGoogleLogin">
              <!-- Email Input -->
              <v-text-field
                v-model="email"
                label="Email Address"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                class="mb-4"
                :rules="emailRules"
                required
              ></v-text-field>

              <!-- Name Input -->
              <v-text-field
                v-model="fullName"
                label="Full Name"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                class="mb-6"
                :rules="nameRules"
                required
              ></v-text-field>

              <!-- Google Login Button -->
              <v-btn
                color="primary"
                block
                size="large"
                @click="handleGoogleLogin"
                rounded="lg"
                class="mb-4"
                :disabled="!email || !fullName"
              >
                <v-icon start>mdi-google</v-icon>
                Sign in with Google
              </v-btn>

              <!-- Error Message -->
              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
                {{ errorMessage }}
              </v-alert>

              <!-- Success Message -->
              <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">
                {{ successMessage }}
              </v-alert>

              <!-- Loading State -->
              <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>
            </v-form>

            <!-- Divider -->
            <v-divider class="my-6"></v-divider>

            <!-- Info Text -->
            <p class="text-caption text-center text-on-surface">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

// Form data
const email = ref('')
const fullName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const nameRules = [
  v => !!v || 'Name is required',
  v => v.length >= 2 || 'Name must be at least 2 characters'
]

// Handle Google Login
async function handleGoogleLogin() {
  // Reset messages
  errorMessage.value = ''
  successMessage.value = ''

  // Validate form
  if (!email.value || !fullName.value) {
    errorMessage.value = 'Please fill in all fields'
    return
  }

  if (!/.+@.+\..+/.test(email.value)) {
    errorMessage.value = 'Please enter a valid email address'
    return
  }

  isLoading.value = true

  try {
    // Send login request to backend
    const response = await fetch('http://127.0.0.1:8080/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value,
        fullName: fullName.value,
        provider: 'google',
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()

    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      email: email.value,
      fullName: fullName.value,
      loginTime: new Date().toISOString()
    }))

    successMessage.value = `Welcome, ${fullName.value}! Redirecting...`

    // Redirect to main app after 1.5 seconds
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Login failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Custom styles for login page */
</style>
