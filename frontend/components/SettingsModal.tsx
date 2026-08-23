import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle2, AlertCircle, Loader2, Settings2 } from 'lucide-react';
import { AIProvider, ProviderSettings } from '../types.ts';
import { testProviderConnection } from '../services/apiService.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProviderSettings;
  onSave: (settings: ProviderSettings) => void;
}

const DEFAULT_MODELS: Record<AIProvider, string> = {
  [AIProvider.VERTEX]: 'gemini-2.5-flash',
  [AIProvider.GEMINI]: 'gemini-2.5-flash',
  [AIProvider.OPENAI]: 'gpt-4o',
  [AIProvider.DEEPSEEK]: 'deepseek-chat',
  [AIProvider.OPENROUTER]: 'anthropic/claude-3.5-sonnet',
  [AIProvider.ANTHROPIC]: 'claude-3-5-sonnet-20241022',
  [AIProvider.CUSTOM]: 'gpt-3.5-turbo'
};

const DEFAULT_URLS: Record<AIProvider, string> = {
  [AIProvider.VERTEX]: '',
  [AIProvider.GEMINI]: '',
  [AIProvider.OPENAI]: 'https://api.openai.com/v1',
  [AIProvider.DEEPSEEK]: 'https://api.deepseek.com/v1',
  [AIProvider.OPENROUTER]: 'https://openrouter.ai/api/v1',
  [AIProvider.ANTHROPIC]: '',
  [AIProvider.CUSTOM]: 'https://your-custom-api.com/v1'
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ProviderSettings>(settings);
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen, settings]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    setLocalSettings({
      ...localSettings,
      provider: newProvider,
      model: DEFAULT_MODELS[newProvider],
      baseUrl: DEFAULT_URLS[newProvider],
      // Keep API key if switching between similar providers, otherwise clear it? 
      // Better to keep it so user doesn't lose it accidentally, they can clear it manually.
    });
    setTestStatus('idle');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      const result = await testProviderConnection(localSettings);
      setTestStatus('success');
      setTestMessage(result.message);
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.message);
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  const needsApiKey = localSettings.provider !== AIProvider.VERTEX;
  const needsBaseUrl = [AIProvider.OPENAI, AIProvider.DEEPSEEK, AIProvider.OPENROUTER, AIProvider.CUSTOM].includes(localSettings.provider);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings2 size={20} className="text-primary-600" />
            AI Provider Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Provider</label>
            <select 
              value={localSettings.provider}
              onChange={handleProviderChange}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value={AIProvider.VERTEX}>Google Vertex AI (ADC)</option>
              <option value={AIProvider.GEMINI}>Google Gemini API</option>
              <option value={AIProvider.OPENAI}>OpenAI</option>
              <option value={AIProvider.DEEPSEEK}>DeepSeek</option>
              <option value={AIProvider.OPENROUTER}>OpenRouter</option>
              <option value={AIProvider.ANTHROPIC}>Anthropic Claude</option>
              <option value={AIProvider.CUSTOM}>Custom OpenAI-Compatible</option>
            </select>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex justify-between">
              Model ID
              <span className="text-xs font-normal text-slate-400">Customizable</span>
            </label>
            <input 
              type="text"
              value={localSettings.model}
              onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
              placeholder="e.g., gemini-2.5-flash"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
            />
          </div>

          {/* Base URL */}
          {needsBaseUrl && (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Base URL</label>
              <input 
                type="text"
                value={localSettings.baseUrl}
                onChange={(e) => setLocalSettings({...localSettings, baseUrl: e.target.value})}
                placeholder="https://api.example.com/v1"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
              />
            </div>
          )}

          {/* API Key */}
          {needsApiKey ? (
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex justify-between">
                API Key
                <button 
                  type="button"
                  onClick={() => setLocalSettings({...localSettings, apiKey: ''})}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  Clear
                </button>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={localSettings.apiKey}
                  onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full p-2.5 pr-16 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-mono"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 font-medium"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Keys are stored locally in your browser and sent securely to the local backend.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 font-medium flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                Vertex AI uses Application Default Credentials (ADC).
              </p>
              <p className="text-xs text-blue-600 mt-1 ml-6">
                Ensure you have run <code>gcloud auth application-default login</code> and set <code>GOOGLE_CLOUD_PROJECT</code> in the backend environment.
              </p>
            </div>
          )}

          {/* Test Connection Result */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
              testStatus === 'testing' ? 'bg-slate-50 text-slate-600 border border-slate-200' :
              testStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {testStatus === 'testing' && <Loader2 size={16} className="animate-spin shrink-0 mt-0.5" />}
              {testStatus === 'success' && <CheckCircle2 size={16} className="shrink-0 mt-0.5" />}
              {testStatus === 'error' && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              <span className="break-words flex-1">{testStatus === 'testing' ? 'Testing connection...' : testMessage}</span>
            </div>
          )}

        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <button 
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Test Connection
          </button>
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
