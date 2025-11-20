<template>
  <v-app>
    <v-main class="bg-background">
      <v-container class="d-flex align-center justify-center" style="min-height: 100vh;">
        <v-card elevation="12" class="pa-8 rounded-xl bg-surface" style="max-width: 500px; width: 100%;">
          <!-- Logo i Títol -->
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

          <!-- Formulari de Login/Registre -->
          <v-card-text>
            <v-form @submit.prevent="isLogin ? handleLogin() : handleRegister()">
              <h2 class="text-h5 text-center mb-6 text-on-surface">{{ isLogin ? 'Inicia Sessió' : 'Crea un Compte' }}</h2>

              <!-- Camp de Nom Complet (Només per a Registre) -->
              <v-text-field
                v-if="!isLogin"
                v-model="fullName"
                label="Nom Complet"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                class="mb-4"
                :rules="nameRules"
                required
              ></v-text-field>

              <!-- Camp d'Email -->
              <v-text-field
                v-model="email"
                label="Adreça d'Email"
                type="email"
                variant="outlined"
                prepend-inner-icon="mdi-email"
                class="mb-4"
                :rules="emailRules"
                required
              ></v-text-field>

              <!-- Camp de Contrasenya -->
              <v-text-field
                v-model="password"
                label="Contrasenya"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                class="mb-6"
                :rules="passwordRules"
                required
              ></v-text-field>

              <!-- Botó d'Enviament -->
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
                {{ isLogin ? 'Inicia Sessió' : 'Registra\'t' }}
              </v-btn>

              <!-- Canviar entre Login/Registre -->
              <v-btn
                variant="text"
                block
                @click="isLogin = !isLogin"
                :disabled="isLoading"
              >
                {{ isLogin ? 'Necessites un compte? Registra\'t' : 'Ja tens un compte? Inicia sessió' }}
              </v-btn>

              <!-- Missatge d'Error -->
              <v-alert v-if="errorMessage" type="error" variant="tonal" class="mt-4">
                {{ errorMessage }}
              </v-alert>

              <!-- Missatge d'Èxit -->
              <v-alert v-if="successMessage" type="success" variant="tonal" class="mt-4">
                {{ successMessage }}
              </v-alert>

              <!-- Estat de Càrrega -->
              <v-progress-linear v-if="isLoading" indeterminate color="primary" class="mt-4"></v-progress-linear>
            </v-form>

            <!-- Divisor -->
            <v-divider class="my-6"></v-divider>

            <!-- Text Informatiu -->
            <p class="text-caption text-center text-on-surface">
              En iniciar sessió, acceptes els nostres Termes de Servei i la Política de Privacitat.
            </p>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'

// Estat del component
const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Regles de validació
const emailRules = [
  v => !!v || 'L\'email és obligatori',
  v => /.+@.+\..+/.test(v) || 'L\'email ha de ser vàlid'
]

const passwordRules = [
  v => !!v || 'La contrasenya és obligatòria',
  v => v.length >= 6 || 'La contrasenya ha de tenir almenys 6 caràcters'
]

const nameRules = [
  v => !!v || 'El nom és obligatori',
  v => v.length >= 2 || 'El nom ha de tenir almenys 2 caràcters'
]

// Propietat computada per a la validació del formulari
const isFormValid = computed(() => {
  const baseValid = email.value && password.value && emailRules.every(rule => rule(email.value) === true) && passwordRules.every(rule => rule(password.value) === true)
  if (isLogin.value) {
    return baseValid
  } else {
    return baseValid && fullName.value && nameRules.every(rule => rule(fullName.value) === true)
  }
})

// Funció d'utilitat per gestionar les trucades a l'API
async function authCall(endpoint, body) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ha ocorregut un error desconegut')
  }

  return data
}

// Gestió del Login
async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true

  try {
    const data = await authCall('login', {
      email: email.value,
      password: password.value
    })

    // Guarda la informació de l'usuari al localStorage
    localStorage.setItem('user', JSON.stringify({
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      loginTime: new Date().toISOString()
    }))

    successMessage.value = `Benvingut de nou, ${data.fullName}! Redirigint...`

    // Redirigeix a l'aplicació principal després de 1.5 segons
    setTimeout(() => {
      window.location.href = '/'
    }, 1500)

  } catch (error) {
    console.error('Error de login:', error)
    errorMessage.value = error.message || 'L\'inici de sessió ha fallat. Si us plau, comprova les teves credencials.'
  } finally {
    isLoading.value = false
  }
}

// Gestió del Registre
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

    successMessage.value = `Compte creat per a ${data.fullName}! Si us plau, inicia sessió ara.`
    // Neteja el formulari i canvia a la vista de login
    email.value = ''
    password.value = ''
    fullName.value = ''
    isLogin.value = true

  } catch (error) {
    console.error('Error de registre:', error)
    errorMessage.value = error.message || 'El registre ha fallat. Si us plau, torna-ho a provar.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Estils personalitzats per a la pàgina de login */
</style>