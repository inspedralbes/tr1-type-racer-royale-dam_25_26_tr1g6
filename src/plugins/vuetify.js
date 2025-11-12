/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          background: '#0a1628', // Deep navy blue
          surface: '#1a2a47', // Slightly lighter navy
          primary: '#4a9eff', // Bright blue accent
          secondary: '#ff6b6b', // Coral/red accent
          error: '#ff6b6b',
          info: '#4a9eff',
          success: '#51cf66', // Green
          warning: '#ffa94d', // Orange
          'on-background': '#e8f0ff',
          'on-surface': '#e8f0ff',
        },
      },
    },
  },
})
