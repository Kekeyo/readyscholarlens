export async function chat(req, res, { model, messages, config, credentials, stream }) {
  const apiKey = credentials?.apiKey;
  if (!apiKey) throw new Error('Anthropic API Key is required.');

  const { system, formattedMessages } = formatMessages(messages);

  const payload = {
    model: model || 'claude-3-5-sonnet-20241022',
    system: system,
    messages: formattedMessages,
    max_tokens: config?.maxTokens || 4096,
    temperature: config?.temperature || 0.5,
    stream: true
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Anthropic API Error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6);
          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'content_block_delta' && data.delta?.text) {
              res.write(`data: ${JSON.stringify({ content: data.delta.text, model, provider: 'anthropic' })}\n\n`);
            } else if (data.type === 'message_stop') {
              res.write(`data: [DONE]\n\n`);
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
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
  const apiKey = credentials?.apiKey;
  if (!apiKey) throw new Error('API Key is required.');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    return { success: true, message: 'Connected to Anthropic successfully.' };
  } catch (error) {
    throw new Error(`Connection Failed: ${error.message}`);
  }
}

function formatMessages(messages) {
  let system = undefined;
  const formattedMessages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = msg.content;
      continue;
    }

    if (typeof msg.content === 'string') {
      formattedMessages.push({ role: msg.role, content: msg.content });
      continue;
    }

    const contentArray = [];
    for (const part of msg.content) {
      if (part.type === 'text') {
        contentArray.push({ type: 'text', text: part.text });
      } else if (part.type === 'file') {
        if (part.mimeType === 'application/pdf') {
          // Anthropic supports PDF base64
          contentArray.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: part.data }
          });
        } else if (part.mimeType.startsWith('image/')) {
          contentArray.push({
            type: 'image',
            source: { type: 'base64', media_type: part.mimeType, data: part.data }
          });
        }
      }
    }
    formattedMessages.push({ role: msg.role, content: contentArray });
  }

  return { system, formattedMessages };
}
