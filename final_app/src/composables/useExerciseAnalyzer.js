import { ref, computed } from 'vue'

// Helper: Calculate angle between three points
function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0
  
  const v1 = { x: p1.x - p2.x, y: p1.y - p2.y }
  const v2 = { x: p3.x - p2.x, y: p3.y - p2.y }
  
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  
  if (mag1 === 0 || mag2 === 0) return 0
  
  const cos = dot / (mag1 * mag2)
  const angle = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI)
  
  return angle
}

// Helper: Get keypoint by name
function getKeypoint(pose, name) {
  return pose.keypoints.find(kp => kp.name === name)
}

export function useExerciseAnalyzer(exerciseName, sendRepetition) {
  const repCount = ref(0)
  const currentQuality = ref(0)
  const feedback = ref('')
  const currentAngle = ref(0)
  const repState = ref('waiting')

  // Rep counting state
  let isInDownPosition = false
  let lastRepTime = 0
  const REP_COOLDOWN = 800 // milliseconds between reps

  const qualityColor = computed(() => {
    if (currentQuality.value > 0.7) return 'text-success'
    if (currentQuality.value > 0.5) return 'text-warning'
    return 'text-error'
  })

  function sendRep(quality, feedbackText) {
    repCount.value++
    lastRepTime = Date.now()
    isInDownPosition = false
    repState.value = 'rep_counted'
    feedback.value = feedbackText
    currentQuality.value = quality

    // Send rep to WebSocket
    if (sendRepetition) {
      sendRepetition({ quality, feedback: feedbackText })
    }

    // Clear feedback after 1 second
    setTimeout(() => {
      feedback.value = ''
    }, 1000)
  }

  // Squat analysis
  function analyzeSquat(pose) {
    const lh = getKeypoint(pose, 'left_hip')
    const lk = getKeypoint(pose, 'left_knee')
    const la = getKeypoint(pose, 'left_ankle')
    const rh = getKeypoint(pose, 'right_hip')
    const rk = getKeypoint(pose, 'right_knee')
    const ra = getKeypoint(pose, 'right_ankle')

    if (!lh || !lk || !la || !rh || !rk || !ra) {
      repState.value = 'no_pose'
      return
    }

    const lAngle = calculateAngle(lh, lk, la)
    const rAngle = calculateAngle(rh, rk, ra)
    const avgAngle = (lAngle + rAngle) / 2

    currentAngle.value = avgAngle
    currentQuality.value = Math.max(0, 1 - Math.abs(avgAngle - 80) / 50)

    // Down position: knee angle < 100
    if (avgAngle < 100) {
      isInDownPosition = true
      repState.value = 'down'
      feedback.value = 'Good! Hold the position...'
    }
    // Up position: knee angle > 140 (and was previously down)
    else if (isInDownPosition && avgAngle > 140) {
      const now = Date.now()
      if (now - lastRepTime > REP_COOLDOWN) {
        sendRep(0.95, 'Rep completed! 🎉')
      }
    } else {
      repState.value = 'up'
    }
  }

  // Push-up analysis
  function analyzePushUp(pose) {
    const ls = getKeypoint(pose, 'left_shoulder')
    const le = getKeypoint(pose, 'left_elbow')
    const lw = getKeypoint(pose, 'left_wrist')
    const rs = getKeypoint(pose, 'right_shoulder')
    const re = getKeypoint(pose, 'right_elbow')
    const rw = getKeypoint(pose, 'right_wrist')

    if (!ls || !le || !lw || !rs || !re || !rw) {
      repState.value = 'no_pose'
      return
    }

    const lAngle = calculateAngle(ls, le, lw)
    const rAngle = calculateAngle(rs, re, rw)
    const avgAngle = (lAngle + rAngle) / 2

    currentAngle.value = avgAngle
    currentQuality.value = Math.max(0, 1 - Math.abs(avgAngle - 70) / 50)

    // Down position: elbow angle < 100
    if (avgAngle < 100) {
      isInDownPosition = true
      repState.value = 'down'
      feedback.value = 'Good! Push back up...'
    }
    // Up position: elbow angle > 150 (and was previously down)
    else if (isInDownPosition && avgAngle > 150) {
      const now = Date.now()
      if (now - lastRepTime > REP_COOLDOWN) {
        sendRep(0.95, 'Rep completed! 🎉')
      }
    } else {
      repState.value = 'up'
    }
  }

  // Lunge analysis
  function analyzeLunge(pose) {
    const lh = getKeypoint(pose, 'left_hip')
    const lk = getKeypoint(pose, 'left_knee')
    const la = getKeypoint(pose, 'left_ankle')
    const rh = getKeypoint(pose, 'right_hip')
    const rk = getKeypoint(pose, 'right_knee')
    const ra = getKeypoint(pose, 'right_ankle')

    if (!lh || !lk || !la || !rh || !rk || !ra) {
      repState.value = 'no_pose'
      return
    }

    const lAngle = calculateAngle(lh, lk, la)
    const rAngle = calculateAngle(rh, rk, ra)
    const angleDiff = Math.abs(lAngle - rAngle)

    currentAngle.value = angleDiff
    currentQuality.value = Math.max(0, 1 - Math.abs(angleDiff - 60) / 40)

    // Lunge position: significant difference between knee angles (> 40)
    if (angleDiff > 40) {
      isInDownPosition = true
      repState.value = 'spread'
      feedback.value = 'Good lunge position!'
    }
    // Back to neutral: angles are similar again (< 20)
    else if (isInDownPosition && angleDiff < 20) {
      const now = Date.now()
      if (now - lastRepTime > REP_COOLDOWN) {
        sendRep(0.95, 'Rep completed! 🎉')
      }
    } else {
      repState.value = 'neutral'
    }
  }

  // Jumping Jack analysis
  function analyzeJumpingJack(pose) {
    const lw = getKeypoint(pose, 'left_wrist')
    const rw = getKeypoint(pose, 'right_wrist')
    const lh = getKeypoint(pose, 'left_hip')
    const rh = getKeypoint(pose, 'right_hip')
    const la = getKeypoint(pose, 'left_ankle')
    const ra = getKeypoint(pose, 'right_ankle')

    if (!lw || !rw || !lh || !rh || !la || !ra) {
      repState.value = 'no_pose'
      return
    }

    // Calculate vertical distance between wrists and hips (arms raised)
    const lWristHipDist = Math.abs(lw.y - lh.y)
    const rWristHipDist = Math.abs(rw.y - rh.y)
    const avgWristHipDist = (lWristHipDist + rWristHipDist) / 2

    // Calculate distance between ankles (feet spread)
    const ankleDist = Math.abs(la.x - ra.x)

    // Combined metric: arms up and feet spread = jumping jack position
    const jumpingJackScore = (avgWristHipDist + ankleDist) / 2

    currentAngle.value = jumpingJackScore
    currentQuality.value = Math.max(0, Math.min(1, jumpingJackScore / 200))

    // Jumping jack position: arms raised (wrists above hips by > 100px) and feet spread (> 150px)
    if (avgWristHipDist > 100 && ankleDist > 150) {
      isInDownPosition = true
      repState.value = 'spread'
      feedback.value = 'Good form! Arms up and feet spread!'
    }
    // Back to neutral: arms down and feet together
    else if (isInDownPosition && avgWristHipDist < 50 && ankleDist < 100) {
      const now = Date.now()
      if (now - lastRepTime > REP_COOLDOWN) {
        sendRep(0.95, 'Rep completed! 🎉')
      }
    } else {
      repState.value = 'neutral'
    }
  }

  // Main analysis function
  function analyzeExercise(pose) {
    const exercise = exerciseName.value.toLowerCase()

    if (exercise === 'squat') {
      analyzeSquat(pose)
    } else if (exercise === 'push-up' || exercise === 'pushup') {
      analyzePushUp(pose)
    } else if (exercise === 'lunge') {
      analyzeLunge(pose)
    } else if (exercise === 'jumping jack' || exercise === 'jumpingjack') {
      analyzeJumpingJack(pose)
    }
  }

  return {
    repCount,
    currentQuality,
    feedback,
    currentAngle,
    repState,
    qualityColor,
    analyzeExercise,
    setRepCount: (count) => repCount.value = count,
  }
}
