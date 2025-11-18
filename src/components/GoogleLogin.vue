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

          <!-- Login/Register Form -->
          <v-card-text>
            <v-form @submit.prevent="isLogin ? handleLogin() : handleRegister()">
              <h2 class="text-h5 text-center mb-6 text-on-surface">{{ isLogin ? 'Login' : 'Create Account' }}</h2>

              <!-- Full Name Input (Only for Register) -->
              <v-text-field
                v-if="!isLogin"
                v-model="fullName"
                label="Full Name"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                class="mb-4"
                :rules="nameRules"
                required
              ></v-text-field>

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

              <!-- Password Input -->
              <v-text-field
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                class="mb-6"
                :rules="passwordRules"
                required
              ></v-text-field>

              <!-- Submit Button -->
              <v-btn
                color="primary"
                block
                size="large"
                type="submit"
                rounded="lg"
                class="mb-4"
                :disabled="!isFormValid || isLoading"
              >
                <v-icon start>{{ isLogin ? 'mdi-login' : 'mdi-account-plus' }}</v-icon>
                {{ isLogin ? 'Login' : 'Register' }}
              </v-btn>

              <!-- Switch to Login/Register -->
              <v-btn
                variant="text"
                block
                @click="isLogin = !isLogin"
                :disabled="isLoading"
              >
                {{ isLogin ? 'Need an account? Register' : 'Already have an account? Login' }}
              </v-btn>

              <!-- Error Message -->
              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
                {{ errorMessage }}
              </v-alert>

              <!-- Success Message -->
              <v-alert v-if="successMessage" type="success" variant="tonal" class="mt-4">
                {{ successMessage }}
              </v-alert>

              <!-- Loading State -->
              <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mt-4"></v-progress-linear>
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
import { ref, computed } from 'vue'

// State
const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 6 || 'Password must be at least 6 characters'
]

const nameRules = [
  v => !!v || 'Name is required',
  v => v.length >= 2 || 'Name must be at least 2 characters'
]

// Computed property for form validation
const isFormValid = computed(() => {
  const baseValid = email.value && password.value && emailRules.every(rule => rule(email.value) === true) && passwordRules.every(rule => rule(password.value) === true)
  if (isLogin.value) {
    return baseValid
  } else {
    return baseValid && fullName.value && nameRules.every(rule => rule(fullName.value) === true)
  }
})

// Utility function to handle API calls
async function authCall(endpoint, body) {
  const response = await fetch(`http://127.0.0.1:8080/api/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'An unknown error occurred')
  }

  return data
}

// Handle Login
async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const data = await authCall('login', {
      email: email.value,
      password: password.value
    })

    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      loginTime: new Date().toISOString()
    }))

    successMessage.value = `Welcome back, ${data.fullName}! Redirecting...`

    // Redirect to main app after 1.5 seconds
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)

  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Login failed. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}

// Handle Register
async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const data = await authCall('register', {
      email: email.value,
      password: password.value,
      fullName: fullName.value
    })

    successMessage.value = `Account created for ${data.fullName}! Please login now.`
    // Clear form and switch to login view
    email.value = ''
    password.value = ''
    fullName.value = ''
    isLogin.value = true

  } catch (error) {
    console.error('Registration error:', error)
    errorMessage.value = error.message || 'Registration failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Custom styles for login page */
</style>
S