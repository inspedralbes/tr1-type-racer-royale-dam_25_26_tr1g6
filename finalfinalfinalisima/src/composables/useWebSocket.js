import { ref, onUnmounted } from 'vue'

export function useWebSocket(url, handlers = {}) {
  const ws = ref(null)
  const wsConnected = ref(false)

  ws.value = new WebSocket(url)

  ws.value.onopen = () => {
    wsConnected.value = true
  }

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      
      // --- LÍNEA DE DIAGNÓSTICO ---
      // ¡¡¡MIRA LA CONSOLA DE "ZAX"!!!
      console.log("%c[MENSAJE WS RECIBIDO]", "color: #7158e2; font-weight: bold;", data);
      // --- FIN DE LÍNEA ---

      handlers[data.type]?.(data)
    } catch (e) {
      console.error('Error parsing WebSocket message:', e)
    }
  }

  ws.value.onerror = (error) => {
    wsConnected.value = false
    console.error('WebSocket error:', error)
  }

  ws.value.onclose = () => {
    wsConnected.value = false
    console.log('WebSocket closed.')
  }

  function send(type, data) {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({ type, ...data }))
    } else {
      console.warn('WebSocket not open. Message not sent:', type, data)
    }
  }

  onUnmounted(() => {
    if (ws.value) {
      ws.value.close()
    }
  })

  return {
    ws: ws.value,
    wsConnected,
    send,
  }
}