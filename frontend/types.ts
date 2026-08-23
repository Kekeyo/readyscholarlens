export enum AnalysisMode {
  AUTHOR = 'author',
  DIRECTION = 'direction'
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: string;
  error: string | null;
}

export interface PaperFile {
  id: string;
  name: string;
  type: 'md' | 'pdf';
  content: string; // text for md, base64 for pdf
  mimeType: string;
}

export enum AIProvider {
  VERTEX = 'vertex',
  GEMINI = 'gemini',
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  OPENROUTER = 'openrouter',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom_openai'
}

export interface ProviderSettings {
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
}
