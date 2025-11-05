export function drawPose(pose, ctx) {
  const pairs = [
    ['nose', 'left_eye'], ['left_eye', 'left_ear'],
    ['nose', 'right_eye'], ['right_eye', 'right_ear'],
    ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
    ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
    ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
    ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
  ]

  // Clear canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  
  // Set canvas size to match video
  ctx.canvas.width = ctx.canvas.offsetWidth
  ctx.canvas.height = ctx.canvas.offsetHeight

  // Draw skeleton
  ctx.strokeStyle = '#00FF00'
  ctx.lineWidth = 2

  for (const [a, b] of pairs) {
    const p1 = pose.keypoints.find(kp => kp.name === a)
    const p2 = pose.keypoints.find(kp => kp.name === b)
    if (p1?.score > 0.5 && p2?.score > 0.5) {
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }
  }

  // Draw keypoints
  ctx.fillStyle = '#FF0000'
  pose.keypoints.forEach(kp => {
    if (kp.score > 0.5) {
      ctx.beginPath()
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI)
      ctx.fill()
    }
  })
}
