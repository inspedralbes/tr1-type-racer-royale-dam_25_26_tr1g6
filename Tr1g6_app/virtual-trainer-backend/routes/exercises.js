import express from 'express';
const router = express.Router();

// Sample data: add as many exercises as you want
const exercises = [
  { id: 1, name: 'squat', target: 'quads', equipment: 'body weight', bodyPart: 'lower body', gifUrl: '' },
  { id: 2, name: 'bench press', target: 'chest', equipment: 'barbell', bodyPart: 'chest', gifUrl: '' },
  { id: 3, name: 'deadlift', target: 'hamstrings', equipment: 'barbell', bodyPart: 'lower body', gifUrl: '' },
  { id: 4, name: 'push up', target: 'chest', equipment: 'body weight', bodyPart: 'chest', gifUrl: '' },
  { id: 5, name: 'pull up', target: 'back', equipment: 'body weight', bodyPart: 'upper body', gifUrl: '' },
  { id: 6, name: 'bicep curl', target: 'biceps', equipment: 'dumbbell', bodyPart: 'upper body', gifUrl: '' },
  { id: 7, name: 'lunges', target: 'quads', equipment: 'body weight', bodyPart: 'lower body', gifUrl: '' },
  { id: 8, name: 'plank', target: 'core', equipment: 'body weight', bodyPart: 'core', gifUrl: '' },
];

router.get('/', (req, res) => {
  res.json(exercises);
});

export default router;
