import * as vertexAdapter from './vertex.js';
import * as geminiAdapter from './gemini.js';
import * as openaiCompatibleAdapter from './openaiCompatible.js';
import * as anthropicAdapter from './anthropic.js';

export function getProviderAdapter(providerName) {
  switch (providerName) {
    case 'vertex':
      return vertexAdapter;
    case 'gemini':
      return geminiAdapter;
    case 'openai':
    case 'deepseek':
    case 'openrouter':
    case 'custom_openai':
      return openaiCompatibleAdapter;
    case 'anthropic':
      return anthropicAdapter;
    default:
      return null;
  }
}
