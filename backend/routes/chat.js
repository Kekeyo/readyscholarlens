import express from 'express';
import { getProviderAdapter } from '../providers/index.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { provider, model, messages, config, credentials, isTest } = req.body;

  if (!provider) {
    return res.status(400).json({ error: 'Bad Request', message: 'Provider is required.' });
  }

  try {
    const adapter = getProviderAdapter(provider);
    
    if (!adapter) {
      return res.status(400).json({ error: 'Bad Request', message: `Unsupported provider: ${provider}` });
    }

    // If it's just a connection test, call the test method if available, or do a minimal chat
    if (isTest) {
      if (adapter.testConnection) {
        const testResult = await adapter.testConnection({ model, credentials });
        return res.json(testResult);
      } else {
        // Fallback test: send a tiny prompt
        const testMessages = [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }];
        // We don't stream the test
        await adapter.chat(req, res, { model, messages: testMessages, config: { maxTokens: 5 }, credentials, stream: false });
        return; // adapter.chat handles the response
      }
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Delegate to the specific provider adapter
    await adapter.chat(req, res, { model, messages, config, credentials, stream: true });

  } catch (error) {
    console.error(`[${provider}] Error:`, error);
    
    // If headers are already sent (streaming started), we must send an error event
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Stream interrupted by an error.' })}\n\n`);
      res.end();
    } else {
      // Standard REST error response
      const statusCode = error.status || error.response?.status || 500;
      res.status(statusCode).json({
        error: 'Provider API Error',
        message: error.message || 'An error occurred while communicating with the AI provider.',
        details: error.response?.data || null
      });
    }
  }
});

export default router;
