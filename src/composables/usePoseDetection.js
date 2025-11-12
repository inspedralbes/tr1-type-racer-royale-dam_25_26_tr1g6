import { ref, onMounted, onUnmounted } from 'vue'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { drawPose } from '@/utils/drawPose'

export function usePoseDetection(videoElement, canvasElement, analyzeExercise) {
  const poseConfidence = ref(0)
  let model = null
  let intervalId = null

  // Load MoveNet model
  onMounted(async () => {
    try {
      await tf.ready()
      const detectorConfig = { modelType: poseDetection.movenet.modelType.DOUBLEPOSE_LIGHTNING }
      model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig)
      console.log('MoveNet loaded successfully')
    } catch (error) {
      console.error('Failed to load MoveNet:', error)
    }
  })

  onUnmounted(() => {
    stopPoseDetection()
    if (videoElement.value && videoElement.value.srcObject) {
      videoElement.value.srcObject.getTracks().forEach(track => track.stop())
    }
  })

  async function setupCamera(videoEl) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 }
      })
      videoEl.srcObject = stream
      await new Promise((resolve) => {
        videoEl.onloadedmetadata = () => {
          resolve()
        }
      })
      videoEl.play()
      return stream
    } catch (error) {
      console.error('Camera access denied:', error)
      return null
    }
  }

  async function detectPose() {
    if (!model || !videoElement.value || !canvasElement.value) return

    try {
      const poses = await model.estimatePoses(videoElement.value)

      if (poses && poses.length > 0) {
        const pose = poses[0]

        // Calculate average confidence
        if (pose.keypoints) {
          const confidences = pose.keypoints.map(kp => kp.score)
          poseConfidence.value = confidences.reduce((a, b) => a + b, 0) / confidences.length
        }

        const ctx = canvasElement.value.getContext('2d')
        // Set canvas dimensions to match video dimensions
        canvasElement.value.width = videoElement.value.videoWidth
        canvasElement.value.height = videoElement.value.videoHeight
        drawPose(pose, ctx)
        analyzeExercise(pose)
      }
    } catch (error) {
      console.error('Pose detection error:', error)
    }
  }

  async function startPoseDetection() {
    if (!model) {
      console.error('Pose model not loaded.')
      return
    }
    const stream = await setupCamera(videoElement.value)
    if (stream) {
      // Use setInterval for detection loop
      intervalId = setInterval(detectPose, 100) // Run detection every 100ms
    }
  }

  function stopPoseDetection() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (videoElement.value && videoElement.value.srcObject) {
      videoElement.value.srcObject.getTracks().forEach(track => track.stop())
      videoElement.value.srcObject = null
    }
    if (canvasElement.value) {
      const ctx = canvasElement.value.getContext('2d')
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
  }

  return {
    poseConfidence,
    startPoseDetection,
    stopPoseDetection,
  }
}
