export async function chat(req, res, { model, messages, config, credentials, stream }) {
  const baseUrl = credentials?.baseUrl || 'https://api.openai.com/v1';
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error('API Key is required for this provider.');
  }

  const formattedMessages = formatMessages(messages);

  const payload = {
    model: model,
    messages: formattedMessages,
    stream: true,
    temperature: config?.temperature || 0.5,
  };

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        // OpenRouter specific headers (optional but good practice)
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'ScholarLens'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the last incomplete line in the buffer

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6);
          if (dataStr === '[DONE]') {
            res.write(`data: [DONE]\n\n`);
            continue;
          }
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content, model, provider: 'openai-compatible' })}\n\n`);
            }
          } catch (e) {
            console.warn('Failed to parse SSE JSON:', dataStr);
          }
        }
      }
    }
    res.end();
  } catch (error) {
    throw error;
  }
}

export async function testConnection({ model, credentials }) {
  const baseUrl = credentials?.baseUrl || 'https://api.openai.com/v1';
  const apiKey = credentials?.apiKey;
  if (!apiKey) throw new Error('API Key is required.');

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    return { success: true, message: 'Connected successfully.' };
  } catch (error) {
    throw new Error(`Connection Failed: ${error.message}`);
  }
}

function formatMessages(messages) {
  return messages.map(msg => {
    if (typeof msg.content === 'string') return msg;

    // Handle multimodal/files
    const contentArray = [];
    for (const part of msg.content) {
      if (part.type === 'text') {
        contentArray.push({ type: 'text', text: part.text });
      } else if (part.type === 'file') {
        // Note: Standard OpenAI chat/completions doesn't support PDF base64 directly.
        // It supports image_url. If it's a PDF, we warn or ignore, but here we just pass it 
        // as text if we can't handle it, or throw.
        if (part.mimeType.startsWith('image/')) {
          contentArray.push({
            type: 'image_url',
            image_url: { url: `data:${part.mimeType};base64,${part.data}` }
          });
        } else {
          // For PDFs on OpenAI/DeepSeek, we inject a warning text instead of crashing,
          // because the frontend might have sent it.
          contentArray.push({ 
            type: 'text', 
            text: `[System Note: A file of type ${part.mimeType} was attached but is not natively supported by this provider's vision API. Content may be missing.]` 
          });
        }
      }
    }
    return { role: msg.role, content: contentArray };
  });
}
