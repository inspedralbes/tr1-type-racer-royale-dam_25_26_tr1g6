// src/composables/useExerciseAnalyzer.js

import { ref } from 'vue';

// --- Funcions d'ajuda per als càlculs ---
function getKeypoint(pose, name) {
  if (!pose?.keypoints) return null;
  return pose.keypoints.find(kp => kp.name === name);
}

function calculateAngle(p1, p2, p3) {
  // Ignorem punts amb poca confiança per a més precisió
  if (!p1 || !p2 || !p3 || p1.score < 0.3 || p2.score < 0.3 || p3.score < 0.3) return null;
  const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

// --- Validadors de postura ---
function isStandingPosture(pose) {
    const shoulder = getKeypoint(pose, 'left_shoulder');
    const hip = getKeypoint(pose, 'left_hip');
    const ankle = getKeypoint(pose, 'left_ankle');

    if (!shoulder || !hip || !ankle) return false;

    // Comprovem si el cos està més o menys vertical
    const verticalAlignment = shoulder.y < hip.y && hip.y < ankle.y;
    // I que no estigui massa desalineat horitzontalment
    const horizontalAlignment = Math.abs(shoulder.x - hip.x) < 50 && Math.abs(hip.x - ankle.x) < 50;
    
    return verticalAlignment && horizontalAlignment;
}

function isPlankPosture(pose) {
    const shoulder = getKeypoint(pose, 'left_shoulder');
    const hip = getKeypoint(pose, 'left_hip');
    const ankle = getKeypoint(pose, 'left_ankle');

    if (!shoulder || !hip || !ankle) return false;

    // Mirem si l'angle turmell-maluc-espatlla és proper a 180 graus (línia recta)
    const bodyAngle = calculateAngle(ankle, hip, shoulder);
    
    return bodyAngle > 150 && bodyAngle < 210;
}


// --- Diccionari amb la lògica de cada exercici ---
const EXERCISE_LOGIC = {
  'squat': {
    validatePosture: isStandingPosture, // Cal estar dret per començar
    getMovementState: (pose) => {
      const angle = calculateAngle(getKeypoint(pose, 'left_hip'), getKeypoint(pose, 'left_knee'), getKeypoint(pose, 'left_ankle'));
      if (angle === null) return 'unknown';
      if (angle < 110) return 'down';
      if (angle > 160) return 'up';
      return 'transitioning';
    }
  },
  'pushup': {
    validatePosture: isPlankPosture, // Cal estar en posició de planxa
    getMovementState: (pose) => {
      const angle = calculateAngle(getKeypoint(pose, 'left_shoulder'), getKeypoint(pose, 'left_elbow'), getKeypoint(pose, 'left_wrist'));
      if (angle === null) return 'unknown';
      if (angle < 90) return 'down';
      if (angle > 160) return 'up';
      return 'transitioning';
    }
  },
  'alternate lateral pulldown': {
      validatePosture: isStandingPosture, // Cal estar dret
      getMovementState: (pose) => {
        const shoulder = getKeypoint(pose, 'left_shoulder');
        const elbow = getKeypoint(pose, 'left_elbow');
        if (!shoulder || !elbow) return 'unknown';
        // 'down' -> colze per sota de l'espatlla
        if (elbow.y > shoulder.y + 20) return 'down';
        // 'up' -> colze per sobre de l'espatlla
        if (elbow.y < shoulder.y - 30) return 'up';
        return 'transitioning';
    }
  }
  // Afegir més exercicis aquí...
};


export function useExerciseAnalyzer(exerciseName, onRepComplete) {
  const repCount = ref(0);
  const feedback = ref('');
  
  let repState = 'up'; // 'up' o 'down'
  let lastRepTime = 0;
  const REP_COOLDOWN = 1000; // 1 segon de refredament entre reps

  function analyzeExercise(poses) {
    if (!poses || poses.length === 0) return;
    
    const userPose = poses[0];
    const exerciseKey = Object.keys(EXERCISE_LOGIC).find(key => exerciseName.value.toLowerCase().includes(key));

    if (!exerciseKey) {
      feedback.value = "Anàlisi per aquest exercici no implementada.";
      return;
    }

    const logic = EXERCISE_LOGIC[exerciseKey];
    
    // Fase 1: Validació de la postura inicial
    if (!logic.validatePosture(userPose)) {
        feedback.value = `Posa't en la posició correcta per començar! (${exerciseKey === 'pushup' ? 'Cos recte' : 'Estigues dret'})`;
        // Si perdem la postura, reiniciem l'estat
        repState = 'up';
        return;
    }
    
    // Fase 2: Anàlisi del moviment (cicle up/down)
    const currentMovementState = logic.getMovementState(userPose);
    const now = Date.now();

    if (repState === 'up' && currentMovementState === 'down') {
      repState = 'down';
      feedback.value = "Correcte! Ara puja.";
      console.log("CANVI D'ESTAT: UP -> DOWN");
    } else if (repState === 'down' && currentMovementState === 'up') {
      if (now - lastRepTime > REP_COOLDOWN) {
        repCount.value++;
        lastRepTime = now;
        repState = 'up'; // Estat a punt per a la següent repetició
        feedback.value = `Repetició ${repCount.value}!`;
        console.log(`REPETICIÓ COMPTADA: ${repCount.value}`);
        if (onRepComplete) {
          onRepComplete({ reps: repCount.value });
        }
      }
    }
  }

  function setRepCount(count) {
    repCount.value = count;
    repState = 'up';
    lastRepTime = 0;
  }

  return { 
    repCount,
    feedback,
    analyzeExercise,
    setRepCount
  };
}