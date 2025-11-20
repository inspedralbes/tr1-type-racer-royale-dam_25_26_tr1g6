import { ref, onMounted, onUnmounted } from 'vue';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { drawPose } from '@/utils/drawPose.js';

// --- Funció d'ajuda per calcular l'angle entre tres punts ---
function calculateAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0;
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

// --- Funció d'ajuda per obtenir un punt clau (keypoint) pel seu nom ---
function getKeypoint(keypoints, name) {
  return keypoints.find(kp => kp.name === name || kp.part === name);
}

export function usePoseDetection(videoElement, canvasElement, analyzeExercise, sessionActive, referencePoseSequence) {
  const poseConfidence = ref(0);
  let model = null;
  let intervalId = null;

  onMounted(async () => {
    try {
      await tf.ready();
      const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
      model = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
      console.log('Model MoveNet carregat correctament');
    } catch (error) {
      console.error('Error en carregar MoveNet:', error);
    }
  });

  onUnmounted(() => {
    stopPoseDetection();
  });

  async function setupCamera(videoEl) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      videoEl.srcObject = stream;
      await new Promise((resolve) => { videoEl.onloadedmetadata = resolve; });
      videoEl.play();
      return stream;
    } catch (error) {
      console.error('Accés a la càmera denegat:', error);
      return null;
    }
  }

  async function detectPose() {
    if (!model || !videoElement.value || !canvasElement.value || !sessionActive.value) return;

    try {
      const poses = await model.estimatePoses(videoElement.value);
      if (!poses || poses.length === 0) return;

      const userPose = poses[0];
      const ctx = canvasElement.value.getContext('2d');
      canvasElement.value.width = videoElement.value.videoWidth;
      canvasElement.value.height = videoElement.value.videoHeight;
      drawPose(userPose, ctx); // Dibuixa l'esquelet de l'usuari

      let qualityScore = 0.5; // Valor per defecte

      // =========================================================================
      // Lògica de comparació: normalitzada i basada en angles
      // =========================================================================
      if (referencePoseSequence.value && userPose.keypoints) {
        // 1. Busquem el frame de referència més semblant
        const referenceFrameKeypoints = findClosestReferencePose(userPose, referencePoseSequence.value);
        
        if (referenceFrameKeypoints) {
          // 2. Calculem la similitud amb la funció nova
          qualityScore = calculatePoseSimilarityByAngles(userPose.keypoints, referenceFrameKeypoints);
        }
      }

      // Passem la posició i la qualitat a l'analitzador de repeticions
      analyzeExercise({ poses: [userPose], quality: qualityScore });

    } catch (error) {
      console.error('Error en la detecció de la posició:', error);
    }
  }

  async function startPoseDetection() {
    if (!model) { console.error('El model de detecció no està carregat.'); return; }
    const stream = await setupCamera(videoElement.value);
    if (stream) {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(detectPose, 100);
    }
  }

  function stopPoseDetection() {
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (videoElement.value && videoElement.value.srcObject) {
      videoElement.value.srcObject.getTracks().forEach(track => track.stop());
      videoElement.value.srcObject = null;
    }
    if (canvasElement.value) {
      const ctx = canvasElement.value.getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  }

  return { poseConfidence, startPoseDetection, stopPoseDetection };
}

// --- Funcions d'ajuda per a la comparació de posicions ---

function findClosestReferencePose(userPose, referenceSequence) {
    if (!referenceSequence.keypoints_sequence || referenceSequence.keypoints_sequence.length === 0) return null;

    let bestMatchIndex = -1;
    let lowestDistance = Infinity;

    // Utilitzem l'esquelet normalitzat per trobar el frame més semblant
    const userNormalized = normalizePose(userPose.keypoints);

    // Iterem fent salts per optimitzar la cerca
    for (let i = 0; i < referenceSequence.keypoints_sequence.length; i += 5) {
        const refFrame = referenceSequence.keypoints_sequence[i];
        const refNormalized = normalizePose(refFrame);
        const distance = calculateVectorDistance(userNormalized, refNormalized);
        if (distance < lowestDistance) {
            lowestDistance = distance;
            bestMatchIndex = i;
        }
    }
    
    return bestMatchIndex !== -1 ? referenceSequence.keypoints_sequence[bestMatchIndex] : null;
}

function normalizePose(keypoints) {
    // Normalitza l'esquelet per fer-lo independent de l'escala i la posició
    const leftHip = getKeypoint(keypoints, 'left_hip');
    const rightHip = getKeypoint(keypoints, 'right_hip');

    if (!leftHip || !rightHip) return keypoints; // No podem normalitzar si no veiem els malucs

    // 1. Calculem el centre (punt mig dels malucs)
    const centerX = (leftHip.x + rightHip.x) / 2;
    const centerY = (leftHip.y + rightHip.y) / 2;
    
    // 2. Calculem l'escala (basada en la distància entre malucs)
    const scale = Math.sqrt(Math.pow(rightHip.x - leftHip.x, 2) + Math.pow(rightHip.y - leftHip.y, 2));
    if (scale === 0) return keypoints; // Evitem divisió per zero

    // 3. Normalitzem cada punt de l'esquelet
    return keypoints.map(kp => ({
        ...kp,
        x: (kp.x - centerX) / scale,
        y: (kp.y - centerY) / scale,
    }));
}

function calculateVectorDistance(keypoints1, keypoints2) {
    let totalDistance = 0;
    let validKeypoints = 0;

    for (let i = 0; i < keypoints1.length; i++) {
        const kp1 = keypoints1[i];
        const kp2 = getKeypoint(keypoints2, kp1.name || kp1.part);
        
        // Només comparem punts si tenen una confiança mínima
        if (kp1 && kp2 && (kp1.score || 1) > 0.5 && (kp2.score || 1) > 0.5) {
            const dx = kp1.x - kp2.x;
            const dy = kp1.y - kp2.y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
            validKeypoints++;
        }
    }
    return validKeypoints > 0 ? totalDistance / validKeypoints : Infinity;
}


function calculatePoseSimilarityByAngles(userKeypoints, refKeypoints) {
    // Llista d'angles clau que definiran la postura
    const angleDefinitions = [
        ['left_shoulder', 'left_elbow', 'left_wrist'],
        ['right_shoulder', 'right_elbow', 'right_wrist'],
        ['left_hip', 'left_knee', 'left_ankle'],
        ['right_hip', 'right_knee', 'right_ankle'],
        ['left_elbow', 'left_shoulder', 'left_hip'],
        ['right_elbow', 'right_shoulder', 'right_hip']
    ];
    
    let totalDifference = 0;
    let anglesCompared = 0;
    
    for (const definition of angleDefinitions) {
        const userP1 = getKeypoint(userKeypoints, definition[0]);
        const userP2 = getKeypoint(userKeypoints, definition[1]);
        const userP3 = getKeypoint(userKeypoints, definition[2]);
        
        const refP1 = getKeypoint(refKeypoints, definition[0]);
        const refP2 = getKeypoint(refKeypoints, definition[1]);
        const refP3 = getKeypoint(refKeypoints, definition[2]);
        
        // Només si podem calcular l'angle en ambdós esquelets
        if (userP1 && userP2 && userP3 && refP1 && refP2 && refP3) {
            const userAngle = calculateAngle(userP1, userP2, userP3);
            const refAngle = calculateAngle(refP1, refP2, refP3);
            
            // Calculem la diferència i la normalitzem (0 a 1)
            totalDifference += Math.abs(userAngle - refAngle) / 180.0;
            anglesCompared++;
        }
    }
    
    if (anglesCompared === 0) return 0;
    
    // L'error mitjà és la diferència total dividida entre el nombre d'angles comparats
    const averageError = totalDifference / anglesCompared;
    
    // La similitud és l'invers de l'error
    return Math.max(0, 1 - averageError);
}