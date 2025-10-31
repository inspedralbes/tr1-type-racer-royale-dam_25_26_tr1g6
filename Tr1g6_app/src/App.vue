  <template>
    <v-app :theme="isDarkTheme ? 'darkTheme' : 'light'">
      <v-app-bar color="background" flat app border>
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
          <v-btn icon @click="toggleTheme" class="ml-2">
            <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
        </v-container>
      </v-app-bar>

      <v-main class="bg-background">
        <v-container class="py-6 py-md-10">
          
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
                      
                      <v-alert v-else class="mb-6" type="warning" icon="mdi-alert-box-outline" variant="tonal">
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
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
  import { GoogleGenerativeAI } from "@google/generative-ai";
  import { useTheme } from 'vuetify';

  // --- (definiciones de variables ref, computed, etc. no cambian) ---
  const search = ref('');
  const exercises = ref([]);
  const selectedExercise = ref(null);
  const loading = ref(true); 
  const loadingType = ref(''); 
  const loadingMessage = ref('');
  const error = ref('');
  const detailsDialog = ref(false);
  const noResultsMessage = ref('');
  const filterHasGif = ref(true); 

  const generatedInstructions = ref('');
  const instructionsLoading = ref(false);
  const tab = ref('instructions'); 

  const page = ref(0); 
  const hasMore = ref(true); 
  const loadingSnackbarMessage = ref('');
  const showLoadingSnackbar = ref(false);

  const youtubeVideoId = ref(null);
  const youtubeLoading = ref(false);

  const theme = useTheme();
  const isDarkTheme = ref(true); 

  function toggleTheme() {
    isDarkTheme.value = !isDarkTheme.value;
    theme.global.name.value = isDarkTheme.value ? 'darkTheme' : 'light';
  }

  // --- (Tus claves API se mantienen intactas) ---
  const GEMINI_API_KEY = 'AIzaSyB15TiFdWSVMil5NvbLGiivNl_kxXragvQ'; 
  const API_KEY = '63e7cf7012msh5e3ce60374b5b8ap1a0ac6jsne3d3901068fb';
  const YOUTUBE_API_KEY = 'AIzaSyA2_JUS03YsPJ5UDHD7WV0mP8PvfdXBVo8'; 
  const PEXELS_API_KEY = 'hXiUs6wTpVBSOUEfCTuf2fdVhpGHNSiTt7hAzoUc78VjLgrQpByDfSGT'; 

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

  const API_HOST = 'exercisedb.p.rapidapi.com';
  const API_URL_SEARCH = 'https://exercisedb.p.rapidapi.com/exercises/name/';
  const API_URL_ALL = 'https://exercisedb.p.rapidapi.com/exercises';

  // --- (Todas las funciones de `filteredExercises` a `searchExercises` no cambian) ---
  const filteredExercises = computed(() => {
    if (!filterHasGif.value) {
      return exercises.value;
    }
    return exercises.value.filter(exercise => exercise.gifUrl || exercise.thumbnailUrl);
  });

  function clearSearch() {
    search.value = '';
    if (!error.value) {
      fetchInitialExercises(); 
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
    };
    return icons[bodyPart.toLowerCase()] || 'mdi-dumbbell'; 
  }

  let scrollContainer = null;

  onMounted(() => {
    fetchInitialExercises();
    scrollContainer = document.querySelector('v-main');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    } else {
      window.addEventListener('scroll', handleScroll);
      scrollContainer = window;
    }
  });

  onUnmounted(() => {
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', handleScroll);
    } else {
      window.removeEventListener('scroll', handleScroll);
    }
  });

  async function handleScroll() {
    if (loading.value || !hasMore.value || search.value) { 
      return;
    }

    let scrollHeight, scrollTop, clientHeight;

    if (scrollContainer === window) {
      scrollHeight = document.documentElement.scrollHeight;
      scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      clientHeight = document.documentElement.clientHeight;
    } else {
      scrollHeight = scrollContainer.scrollHeight;
      scrollTop = scrollContainer.scrollTop;
      clientHeight = scrollContainer.clientHeight;
    }

    if (scrollTop + clientHeight >= scrollHeight - 300) {
      await fetchMoreExercises();
    }
  }

  async function fetchInitialExercises() {
    loading.value = true;
    loadingType.value = 'initial';
    loadingMessage.value = 'Cargando tu dosis de motivación...';
    error.value = '';
    noResultsMessage.value = '';
    page.value = 0; 
    exercises.value = []; 
    hasMore.value = true;

    try {
      const response = await fetch(`${API_URL_ALL}?limit=200`, { 
        method: 'GET',
        headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera antes de reintentar.');
        throw new Error(`Error al cargar ejercicios iniciales: ${response.statusText}.`);
      }
      const data = await response.json();
      const exercisesWithThumbnails = data.map(ex => ({
        ...ex,
        thumbnailUrl: null,
        thumbnailLoading: false
      }));
      
      exercises.value = shuffleArray(exercisesWithThumbnails); 
      
      exercises.value = exercises.value.slice(0, 20); 
      hasMore.value = exercises.value.length < data.length; 
    } catch (err) {
      error.value = err.message;
      noResultsMessage.value = 'No se pudieron cargar los ejercicios. Verifica tu conexión y API Keys.';
      hasMore.value = false; 
    } finally {
      loading.value = false;
      loadingType.value = '';
    }
  }

  async function fetchMoreExercises() {
    if (loading.value || !hasMore.value) return; 

    loading.value = true;
    loadingType.value = 'infinity-scroll';
    loadingSnackbarMessage.value = 'Cargando más ejercicios...';
    showLoadingSnackbar.value = true;
    
    try {
      if (search.value.trim()) {
        hasMore.value = false; 
        return;
      }

      page.value++;
      
      const response = await fetch(`${API_URL_ALL}?limit=1000`, { 
        method: 'GET',
        headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera antes de reintentar.');
        throw new Error(`Error al cargar más ejercicios: ${response.statusText}.`);
      }
      const data = await response.json();
      
      const newRandomExercises = shuffleArray(data).slice(0, 20).map(ex => ({
        ...ex,
        thumbnailUrl: null,
        thumbnailLoading: false
      }));
      
      const uniqueNewExercises = newRandomExercises.filter(
        (newEx) => !exercises.value.some((existingEx) => existingEx.id === newEx.id)
      );
      
      exercises.value.push(...uniqueNewExercises);
      hasMore.value = true; 
    } catch (err) {
      error.value = err.message;
      hasMore.value = false;
    } finally {
      loading.value = false;
      loadingType.value = '';
      showLoadingSnackbar.value = false;
    }
  }


  async function searchExercises() {
    if (!search.value.trim()) {
      error.value = "Por favor, ingresa un nombre de ejercicio para buscar.";
      await nextTick(); 
      return;
    }
    
    loading.value = true;
    loadingType.value = 'search';
    loadingMessage.value = `Buscando "${search.value}"...`;
    error.value = '';
    noResultsMessage.value = '';
    exercises.value = []; 
    hasMore.value = false; 

    try {
      const response = await fetch(`${API_URL_SEARCH}${search.value.toLowerCase()}?limit=100`, { 
        method: 'GET',
        headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST },
      });
      if (!response.ok) {
        if (response.status === 429) throw new Error('Demasiadas solicitudes a la API. Espera antes de reintentar.');
        throw new Error(`Error al buscar: ${response.statusText}.`);
      }
      
      const data = await response.json();
      
      exercises.value = data.map(ex => ({
        ...ex,
        thumbnailUrl: null,
        thumbnailLoading: false
      }));
      
      if (data.length === 0) {
        noResultsMessage.value = `No se encontraron ejercicios para "${search.value}". Intenta otra palabra clave.`;
      }
    } catch (err) {
      error.value = `Ocurrió un error al buscar: ${err.message}`;
    } finally {
      loading.value = false;
      loadingType.value = '';
    }
  }

  // --- INICIO DE MODIFICACIÓN: showDetails() ---
  async function showDetails(exercise) {
    selectedExercise.value = exercise;
    detailsDialog.value = true;
    tab.value = 'instructions'; 
    
    youtubeVideoId.value = null;
    youtubeLoading.value = false;
    
    instructionsLoading.value = true;
    generatedInstructions.value = '';
    generateGeminiInstructions(exercise); 

    // MODIFICADO: Buscamos en YouTube SIEMPRE que no haya un GIF.
    // Ya no comprobamos si existe 'thumbnailUrl'.
    if (!exercise.gifUrl) {
      youtubeLoading.value = true;
      try {
        const query = `${exercise.name} ${translateToSpanish(exercise.target)} ejercicio tutorial`;
        const youtubeResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`);
        if (!youtubeResponse.ok) throw new Error('Error al buscar en YouTube');
        
        const youtubeData = await youtubeResponse.json();
        if (youtubeData.items && youtubeData.items.length > 0) {
          youtubeVideoId.value = youtubeData.items[0].id.videoId;
        }
      } catch (err) {
        console.error("Error al buscar video de YouTube:", err);
      } finally {
        youtubeLoading.value = false;
      }
    }
  }
  // --- FIN DE MODIFICACIÓN: showDetails() ---

  // --- (El resto de funciones: generateGeminiInstructions, translateToSpanish, Pexels, etc. no cambian) ---
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
  `;

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      generatedInstructions.value = text;

    } catch (err) {
      console.error("Error al generar instrucciones con Gemini:", err);
      generatedInstructions.value = 'Error: No se pudieron generar las instrucciones. Verifica tu API Key de Gemini y tu conexión a internet.';
    } finally {
      instructionsLoading.value = false;
    }
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function translateToSpanish(term) {
    if (!term) return 'No especificado';
    
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
    };

    return translations[term.toLowerCase()] || term;
  }


  async function handleIntersection(isIntersecting, exercise) {
    if (isIntersecting && !exercise.gifUrl && !exercise.thumbnailUrl && !exercise.thumbnailLoading) {
      await fetchPexelsThumbnail(exercise);
    }
  }

  async function fetchPexelsThumbnail(exercise) {
    // Esta comprobación está ARREGLADA y SÍ permitirá que tu clave funcione
    if (exercise.thumbnailLoading || !PEXELS_API_KEY || PEXELS_API_KEY.includes('TU_API_KEY')) {
      exercise.thumbnailLoading = false;
      return; 
    }
    
    exercise.thumbnailLoading = true;
    
    try {
      const query = `${exercise.name} ${translateToSpanish(exercise.target)} gym`;
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      });

      if (!response.ok) {
        if (response.status === 429) console.error('Límite de Pexels API alcanzado.');
        throw new Error('Error en la API de Pexels');
      }

      const data = await response.json();
      if (data.photos && data.photos.length > 0) {
        exercise.thumbnailUrl = data.photos[0].src.medium;
      } else {
        const fallbackQuery = `${translateToSpanish(exercise.target)} exercise`;
        const fallbackResponse = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(fallbackQuery)}&per_page=1&orientation=landscape`, {
          headers: { 'Authorization': PEXELS_API_KEY }
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.photos && fallbackData.photos.length > 0) {
            exercise.thumbnailUrl = fallbackData.photos[0].src.medium;
          }
        }
      }

    } catch (err) {
      console.error("Error al buscar miniatura en Pexels:", err);
    } finally {
      exercise.thumbnailLoading = false;
    }
  }
  </script>

  <style scoped>
  .v-application {
    font-family: 'Roboto', sans-serif; 
  }

  .app-background {
    background-color: var(--v-theme-background); 
  }

  .exercise-card {
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;
  }

  .exercise-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  }

  .card-image-container {
    position: relative;
    height: 200px; 
  }

  .card-image {
    transition: transform 0.3s ease-in-out;
  }

  .exercise-card:hover .card-image {
    transform: scale(1.05);
  }

  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%);
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    justify-content: flex-end; 
  }

  .exercise-card:hover .card-overlay {
    opacity: 1;
  }

  .card-overlay .v-btn {
    margin: 10px;
  }

  .instructions-content {
    line-height: 1.8; 
    font-size: 1rem;
    color: var(--v-theme-on-surface); 
  }

  .instructions-content strong {
    color: var(--v-theme-primary); 
    display: block;
    margin-top: 1.5em; 
    margin-bottom: 0.8em;
    font-size: 1.15em;
    font-weight: 700;
  }
  </style>
