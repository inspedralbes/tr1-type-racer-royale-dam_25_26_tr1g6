import express from 'express';
import { v4 as uuidv4 } from 'uuid';
const router = express.Router();

router.post('/create', (req, res) => {
  const sessionId = uuidv4();
  res.json({ sessionId });
});

export default router;
