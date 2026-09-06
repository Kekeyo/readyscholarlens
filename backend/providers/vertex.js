import { GoogleGenAI } from '@google/genai';

export async function chat(req, res, { model, messages, config, credentials, stream }) {
  // Vertex AI uses ADC. We don't need an API key from the frontend.
  // It relies on GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION env vars.
  const ai = new GoogleGenAI({ vertexai: true });
  
  const formattedContents = formatMessages(messages);

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model || 'gemini-3.8-flash',
      contents: formattedContents.contents,
      config: {
        systemInstruction: formattedContents.systemInstruction,
        temperature: config?.temperature || 0.5,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ content: chunk.text, model, provider: 'vertex' })}\n\n`);
      }
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    throw error;
  }
}

export async function testConnection({ model }) {
  try {
    const ai = new GoogleGenAI({ vertexai: true });
    await ai.models.generateContent({
      model: model || 'gemini-3.8-flash',
      contents: 'Hi',
      config: { maxOutputTokens: 5 }
    });
    return { success: true, message: 'Connected to Vertex AI successfully.' };
  } catch (error) {
    throw new Error(`Vertex AI Connection Failed: ${error.message}. Ensure ADC is configured and Project ID is set.`);
  }
}

function formatMessages(messages) {
  let systemInstruction = undefined;
  const contents = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = msg.content;
      continue;
    }

    const parts = [];
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === 'text') {
          parts.push({ text: part.text });
        } else if (part.type === 'file') {
          parts.push({
            inlineData: {
              mimeType: part.mimeType,
              data: part.data
            }
          });
        }
      }
    } else {
      parts.push({ text: msg.content });
    }

    contents.push({ role: msg.role, parts });
  }

  return { systemInstruction, contents };
}
