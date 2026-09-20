import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'zh' | 'en';

const messages = {
  zh: {
    subtitle: 'AI 驱动的学术论文分析', localClient: '本地 BYOK 客户端', language: '界面语言', settings: 'AI 服务设置',
    selectMode: '选择分析模式', authorMode: '同老师类型', directionMode: '同方向论文', singlePaperMode: '单篇深度分析',
    authorDescription: '提取作者独特的写作风格、研究方法与学术特征。', directionDescription: '分析该领域的核心问题、主要贡献与未来趋势。', singlePaperDescription: '逐篇拆解研究动机、方法逻辑、创新证据与实验结论。',
    documents: '文档', clearAll: '全部清除', clearConfirm: '确定要移除全部已上传文件吗？', addFiles: '添加文件', addFolder: '添加文件夹',
    processingFiles: '正在处理文件…', dragFiles: '将多个文件拖放到这里', fileSupport: '支持不限数量的 PDF 和 Markdown 文件',
    pdfWarning: '提示：Vertex AI、Gemini 和 Anthropic 完整支持直接分析 PDF。其他服务（如 OpenAI/DeepSeek）可能忽略 PDF 内容，建议使用 Markdown 以获得最佳兼容性。',
    removeFile: '移除文件', addMoreFiles: '继续添加文件', notes: '补充说明 / 手动输入（可选）', notesPlaceholder: '粘贴补充的 Markdown、文本或具体要求…',
    fileReadError: '读取文件时发生错误。', startAnalysis: '开始分析', analyzingDocuments: '正在分析 {count} 篇文档…', analyzingText: '正在分析文本…', needInput: '请至少提供一篇文档或一段待分析文本。',
    analysisFailed: '分析失败', ready: '准备开始分析', readyHint: '选择分析模式，添加论文或输入文本，然后点击“开始分析”。',
    results: '分析结果', generating: '生成中…', editingMode: '编辑模式', edit: '编辑', cancel: '取消', save: '保存', export: '导出', generatingPdf: '正在生成 PDF…',
    plainText: '纯文本 (.txt)', savePdf: '保存为 PDF', initAnalysis: '正在初始化分析…', parserLoading: '正在加载解析器…', pdfLibraryLoading: 'PDF 生成组件仍在加载，请稍后重试。', pdfFailed: 'PDF 生成失败。',
    resizePanels: '调整输入区与结果区宽度', resizeHint: '拖动调整宽度 · 双击恢复默认比例',
    providerSettings: 'AI 服务设置', provider: '服务商', customProvider: '自定义 OpenAI 兼容接口', modelChoice: '模型（选择或自定义）', currentModel: '当前生效', notSet: '未设置',
    customModel: '自定义模型 ID（手动输入）…', modelId: '模型 ID', customizable: '可自定义', enterModel: '输入模型 ID', baseUrl: '接口地址', apiKey: 'API 密钥', clear: '清除', show: '显示', hide: '隐藏',
    keyStorage: '密钥仅保存在当前浏览器中，并安全发送至本地后端。', testing: '正在测试连接…', testConnection: '测试连接', saveSettings: '保存设置',
    vertexInfoBefore: 'Google Vertex AI 使用后端 ADC 认证。Project ID 与 Location 已由后端', vertexInfoAfter: '统一管理。',
  },
  en: {
    subtitle: 'AI-Powered Academic Paper Analysis', localClient: 'Local BYOK Client', language: 'Language', settings: 'AI Provider Settings',
    selectMode: 'Select Analysis Mode', authorMode: 'Author Style', directionMode: 'Research Direction', singlePaperMode: 'Single-Paper Deep Dive',
    authorDescription: "Extracts the author's unique writing style, methodologies, and academic signature.", directionDescription: 'Analyzes the core research problem, contributions, and future trends of the field.', singlePaperDescription: 'Explains the paper’s motivation, method logic, evidence for novelty, and experimental conclusions.',
    documents: 'Documents', clearAll: 'Clear All', clearConfirm: 'Are you sure you want to remove all uploaded files?', addFiles: 'Add Files', addFolder: 'Add Folder',
    processingFiles: 'Processing files…', dragFiles: 'Drag & drop multiple files here', fileSupport: 'Supports unlimited PDF and Markdown files',
    pdfWarning: 'Note: Direct PDF analysis is fully supported by Vertex AI, Gemini, and Anthropic. Other providers (such as OpenAI/DeepSeek) may ignore PDF content. Use Markdown for best compatibility.',
    removeFile: 'Remove file', addMoreFiles: 'Add more files', notes: 'Additional Notes / Manual Input (Optional)', notesPlaceholder: 'Paste any additional markdown, text, or specific instructions here…',
    fileReadError: 'An error occurred while reading the files.', startAnalysis: 'Start Analysis', analyzingDocuments: 'Analyzing {count} document(s)…', analyzingText: 'Analyzing text…', needInput: 'Please provide at least one document or some text to analyze.',
    analysisFailed: 'Analysis Failed', ready: 'Ready for Analysis', readyHint: 'Select a mode, add your papers or enter text, and click Analyze.',
    results: 'Analysis Results', generating: 'Generating…', editingMode: 'Editing Mode', edit: 'Edit', cancel: 'Cancel', save: 'Save', export: 'Export', generatingPdf: 'Generating PDF…',
    plainText: 'Plain Text (.txt)', savePdf: 'Save as PDF', initAnalysis: 'Initializing analysis…', parserLoading: 'Loading parser…', pdfLibraryLoading: 'PDF generation library is still loading. Please try again in a moment.', pdfFailed: 'Failed to generate PDF.',
    resizePanels: 'Resize input and results panels', resizeHint: 'Drag to resize · Double-click to reset',
    providerSettings: 'AI Provider Settings', provider: 'Provider', customProvider: 'Custom OpenAI-Compatible', modelChoice: 'Model (select or enter a custom model)', currentModel: 'Active', notSet: 'Not set',
    customModel: 'Custom model ID (manual input)…', modelId: 'Model ID', customizable: 'Customizable', enterModel: 'Enter a model ID', baseUrl: 'Base URL', apiKey: 'API Key', clear: 'Clear', show: 'SHOW', hide: 'HIDE',
    keyStorage: 'Keys are stored locally in your browser and sent securely to the local backend.', testing: 'Testing connection…', testConnection: 'Test Connection', saveSettings: 'Save Settings',
    vertexInfoBefore: 'Google Vertex AI uses backend ADC authentication. Project ID and Location are managed in', vertexInfoAfter: 'by the backend.',
  },
} as const;

type MessageKey = keyof typeof messages.zh;
type I18nContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: MessageKey, values?: Record<string, string | number>) => string };

const I18nContext = createContext<I18nContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => localStorage.getItem('scholarLensLanguage') === 'en' ? 'en' : 'zh');
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem('scholarLensLanguage', nextLanguage);
  };

  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'; }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values) => {
      let text = messages[language][key] as string;
      Object.entries(values || {}).forEach(([name, value]) => { text = text.replace(`{${name}}`, String(value)); });
      return text;
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
};
