import express from 'express';
import fs from 'fs';
import path from 'path';
const router = express.Router();

const filePath = path.join(process.cwd(), 'data/results.json');

// Ensure file exists
if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));

router.get('/', (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(data);
});

router.post('/', (req, res) => {
  const newResult = req.body; // { sessionId, participants: [{name, reps}], timestamp }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  data.push(newResult);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

export default router;
