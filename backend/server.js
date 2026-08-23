import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';

// Load environment variables from .env.local if it exists
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.API_BACKEND_PORT || 5000;

// Middleware
app.use(cors());
// Increase payload limit for base64 PDF uploads
app.use(express.json({ limit: process.env.API_PAYLOAD_MAX_SIZE || '50mb' }));

// Routes
app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ScholarLens Backend is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ScholarLens Backend Router running on http://localhost:${PORT}`);
});
